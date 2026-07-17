const catchAsync = require('../utils/catchAsync');
const portfolioService = require('../services/portfolioService');

const analyze = catchAsync(async (req, res) => {
  const { watchlist } = req.body;
  const result = await portfolioService.analyze(req.user, { watchlist });
  res.status(201).json({ status: 201, data: result });
});

const history = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  const portfolios = await portfolioService.getHistory(req.user._id, limit);
  res.status(200).json({ status: 200, data: portfolios });
});

const latest = catchAsync(async (req, res) => {
  const result = await portfolioService.getLatest(req.user._id);
  res.status(200).json({ status: 200, data: result });
});

module.exports = { analyze, history, latest };
