const User = require('../models/User');
const ApiError = require('../utils/ApiError');

async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return user.toProfileJSON();
}

async function updateProfile(userId, updates) {
  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  });
  if (!user) throw ApiError.notFound('User not found');
  return user.toProfileJSON();
}

async function deleteProfile(userId) {
  const user = await User.findByIdAndDelete(userId);
  if (!user) throw ApiError.notFound('User not found');
}

module.exports = { getProfile, updateProfile, deleteProfile };
