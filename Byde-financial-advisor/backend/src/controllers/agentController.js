const catchAsync = require('../utils/catchAsync');
const orchestrator = require('../agents/orchestrator');

const run = catchAsync(async (req, res) => {
  const { watchlist } = req.body;
  const result = await orchestrator.runPipeline(req.user, { watchlist });
  res.status(201).json({
    status: 201,
    data: {
      portfolio: result.portfolio,
      recommendation: result.recommendation,
    },
  });
});

const getStatus = catchAsync(async (req, res) => {
  res.status(200).json({ status: 200, data: orchestrator.getStatus() });
});

module.exports = { run, getStatus };
