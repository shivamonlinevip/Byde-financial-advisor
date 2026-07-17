const crypto = require('crypto');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/tokens');
const logger = require('../utils/logger');

function issueTokenPair(user) {
  const payload = { sub: user._id.toString() };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  return { accessToken, refreshToken };
}

async function register(input) {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = new User(input);
  const { accessToken, refreshToken } = issueTokenPair(user);
  user.refreshTokens = [refreshToken];
  await user.save();

  logger.info(`New user registered: ${user.email}`);
  return { user: user.toProfileJSON(), accessToken, refreshToken };
}

async function login(email, password) {
  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const { accessToken, refreshToken } = issueTokenPair(user);
  user.refreshTokens.push(refreshToken);
  // keep at most 5 concurrent sessions per user
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }
  await user.save();

  return { user: user.toProfileJSON(), accessToken, refreshToken };
}

async function logout(userId, refreshToken) {
  const user = await User.findById(userId).select('+refreshTokens');
  if (!user) return;
  user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
  await user.save();
}

async function refresh(refreshToken) {
  if (!refreshToken) throw ApiError.unauthorized('Refresh token required');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub).select('+refreshTokens');
  if (!user || !user.refreshTokens.includes(refreshToken)) {
    throw ApiError.unauthorized('Refresh token not recognized');
  }

  // rotate refresh token
  const { accessToken, refreshToken: newRefreshToken } = issueTokenPair(user);
  user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
  user.refreshTokens.push(newRefreshToken);
  await user.save();

  return { accessToken, refreshToken: newRefreshToken };
}

async function forgotPassword(email) {
  const user = await User.findOne({ email });
  if (!user) {
    // Do not reveal whether the email exists
    logger.info(`Password reset requested for unknown email: ${email}`);
    return;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  await user.save();

  // In production this would be emailed via a mail provider (e.g. SES/SendGrid).
  // For this hackathon build we log it so the flow is testable end-to-end.
  logger.info(`Password reset token for ${email}: ${rawToken}`);
  return rawToken;
}

async function resetPassword(rawToken, newPassword) {
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires +refreshTokens');

  if (!user) {
    throw ApiError.badRequest('Password reset token is invalid or has expired');
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // invalidate all existing sessions
  await user.save();
}

module.exports = { register, login, logout, refresh, forgotPassword, resetPassword };
