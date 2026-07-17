const config = require('../config');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    error = new ApiError(statusCode, error.message || 'Internal server error', false);
  }

  if (error.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${error.message}`, { stack: err.stack });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${error.message}`);
  }

  const response = {
    status: error.statusCode,
    message: error.message,
    ...(error.details ? { details: error.details } : {}),
    ...(config.env === 'development' ? { stack: err.stack } : {}),
  };

  res.status(error.statusCode).json(response);
}

module.exports = errorHandler;
