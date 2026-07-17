const Joi = require('joi');

const analyze = Joi.object({
  watchlist: Joi.array().items(Joi.string().uppercase()).default([]),
  forceRefresh: Joi.boolean().default(false),
});

module.exports = { analyze };
