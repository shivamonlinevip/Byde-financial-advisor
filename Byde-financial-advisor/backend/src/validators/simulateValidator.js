const Joi = require('joi');

const simulate = Joi.object({
  inflation: Joi.number().min(-10).max(50).required(),
  interestRate: Joi.number().min(0).max(50).required(),
  marketCrash: Joi.boolean().default(false),
  GDPGrowth: Joi.number().min(-20).max(20).required(),
  recommendationId: Joi.string().optional(),
});

module.exports = { simulate };
