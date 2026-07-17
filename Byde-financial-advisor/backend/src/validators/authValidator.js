const Joi = require('joi');

const register = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
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
});

const login = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refresh = Joi.object({
  refreshToken: Joi.string().optional(), // may also arrive via httpOnly cookie
});

const forgotPassword = Joi.object({
  email: Joi.string().email().required(),
});

const resetPassword = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).max(128).required(),
});

module.exports = { register, login, refresh, forgotPassword, resetPassword };
