const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/tokens');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');

/**
 * Requires a valid Bearer access token. Attaches req.user (lean profile)
 * on success.
 */
const authenticate = catchAsync(async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or malformed Authorization header');
  }

  const token = header.split(' ')[1];

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired access token');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw ApiError.unauthorized('User no longer exists');
  }

  req.user = user;
  next();
});

module.exports = authenticate;
