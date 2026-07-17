const Recommendation = require('../models/Recommendation');
const ApiError = require('../utils/ApiError');

async function getExplanation(recommendationId, userId) {
  const rec = await Recommendation.findOne({ _id: recommendationId, userId }).populate('portfolio');
  if (!rec) throw ApiError.notFound('Recommendation not found');

  return {
    recommendation: rec.portfolio,
    confidence: rec.confidence,
    reason: rec.reason,
    sources: rec.sources,
    tradeoffs: rec.tradeoffs,
    alternatives: rec.alternatives,
    rejected: rec.rejectedReasons,
    decisionTree: rec.decisionTree,
    reasoningTimeline: rec.reasoningTimeline,
  };
}

async function getReasoning(recommendationId, userId) {
  const rec = await Recommendation.findOne({ _id: recommendationId, userId });
  if (!rec) throw ApiError.notFound('Recommendation not found');
  return { reasoningTimeline: rec.reasoningTimeline, reason: rec.reason, confidence: rec.confidence };
}

async function getDecisionTree(recommendationId, userId) {
  const rec = await Recommendation.findOne({ _id: recommendationId, userId });
  if (!rec) throw ApiError.notFound('Recommendation not found');
  return rec.decisionTree;
}

module.exports = { getExplanation, getReasoning, getDecisionTree };
