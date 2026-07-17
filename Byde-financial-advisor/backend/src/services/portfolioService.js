const orchestrator = require('../agents/orchestrator');
const Portfolio = require('../models/Portfolio');
const Recommendation = require('../models/Recommendation');
const ApiError = require('../utils/ApiError');

async function analyze(user, options) {
  const result = await orchestrator.runPipeline(user, options);
  return {
    portfolio: result.portfolio,
    recommendation: result.recommendation,
  };
}

async function getHistory(userId, limit = 20) {
  return Portfolio.find({ userId }).sort({ createdAt: -1 }).limit(limit);
}

async function getLatest(userId) {
  const portfolio = await Portfolio.findOne({ userId }).sort({ createdAt: -1 });
  if (!portfolio) throw ApiError.notFound('No portfolio found. Run /api/portfolio/analyze first.');

  const recommendation = await Recommendation.findOne({ portfolio: portfolio._id });
  return { portfolio, recommendation };
}

module.exports = { analyze, getHistory, getLatest };
