const Joi = require('joi');

const updateProfile = Joi.object({
  name: Joi.string().min(2).max(100),
  riskProfile: Joi.string().valid('conservative', 'moderate', 'aggressive'),
  investmentGoal: Joi.string().valid(
    'retirement',
    'wealth_growth',
    'education',
    'home_purchase',
    'short_term_gains',
    'other'
  ),
  investmentAmount: Joi.number().min(0),
  investmentDuration: Joi.number().min(0),
}).min(1);

module.exports = { updateProfile };
