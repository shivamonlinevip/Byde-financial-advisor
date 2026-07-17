/**
 * Wraps an async route/controller function and forwards any rejected
 * promise to Express's error handling middleware via next().
 * @param {Function} fn - async function (req, res, next)
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
