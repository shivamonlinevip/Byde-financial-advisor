const ApiError = require('../utils/ApiError');

/**
 * Returns an Express middleware that validates req[property] against
 * the given Joi schema. On failure, forwards a 400 ApiError with details.
 * @param {import('joi').Schema} schema
 * @param {'body'|'query'|'params'} property
 */
const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const details = error.details.map((d) => d.message);
    return next(ApiError.badRequest('Validation failed', details));
  }

  req[property] = value;
  return next();
};

module.exports = validate;
