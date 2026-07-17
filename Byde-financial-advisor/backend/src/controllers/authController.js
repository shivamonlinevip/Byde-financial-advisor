const catchAsync = require('../utils/catchAsync');
const authService = require('../services/authService');
const config = require('../config');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const register = catchAsync(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  res.status(201).json({ status: 201, data: { user, accessToken } });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login(email, password);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  res.status(200).json({ status: 200, data: { user, accessToken } });
});

const logout = catchAsync(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (req.user && refreshToken) {
    await authService.logout(req.user._id, refreshToken);
  }
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
  res.status(200).json({ status: 200, message: 'Logged out successfully' });
});

const refresh = catchAsync(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  const { accessToken, refreshToken: newRefreshToken } = await authService.refresh(refreshToken);
  res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);
  res.status(200).json({ status: 200, data: { accessToken } });
});

const forgotPassword = catchAsync(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  res.status(200).json({
    status: 200,
    message: 'If an account with that email exists, a password reset link has been sent.',
  });
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password);
  res.status(200).json({ status: 200, message: 'Password has been reset successfully.' });
});

module.exports = { register, login, logout, refresh, forgotPassword, resetPassword };
