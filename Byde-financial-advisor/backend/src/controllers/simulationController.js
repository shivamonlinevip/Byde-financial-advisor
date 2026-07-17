const catchAsync = require('../utils/catchAsync');
const simulationService = require('../services/simulationService');

const simulate = catchAsync(async (req, res) => {
  const result = await simulationService.simulate(req.user._id, req.body);
  res.status(200).json({ status: 200, data: result });
});

module.exports = { simulate };
