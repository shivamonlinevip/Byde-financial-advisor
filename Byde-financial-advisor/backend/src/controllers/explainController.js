const catchAsync = require('../utils/catchAsync');
const explainabilityService = require('../services/explainabilityService');

const explain = catchAsync(async (req, res) => {
  const data = await explainabilityService.getExplanation(req.params.recommendationId, req.user._id);
  res.status(200).json({ status: 200, data });
});

const reasoning = catchAsync(async (req, res) => {
  const data = await explainabilityService.getReasoning(req.params.recommendationId, req.user._id);
  res.status(200).json({ status: 200, data });
});

const decisionTree = catchAsync(async (req, res) => {
  const data = await explainabilityService.getDecisionTree(req.params.recommendationId, req.user._id);
  res.status(200).json({ status: 200, data });
});

module.exports = { explain, reasoning, decisionTree };
