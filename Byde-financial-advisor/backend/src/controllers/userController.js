const catchAsync = require('../utils/catchAsync');
const userService = require('../services/userService');

const getProfile = catchAsync(async (req, res) => {
  const profile = await userService.getProfile(req.user._id);
  res.status(200).json({ status: 200, data: profile });
});

const updateProfile = catchAsync(async (req, res) => {
  const profile = await userService.updateProfile(req.user._id, req.body);
  res.status(200).json({ status: 200, data: profile });
});

const deleteProfile = catchAsync(async (req, res) => {
  await userService.deleteProfile(req.user._id);
  res.status(200).json({ status: 200, message: 'Account deleted successfully' });
});

module.exports = { getProfile, updateProfile, deleteProfile };
