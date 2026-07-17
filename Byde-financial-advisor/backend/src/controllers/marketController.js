const catchAsync = require('../utils/catchAsync');
const marketService = require('../services/marketService');

const getStocks = catchAsync(async (req, res) => {
  const symbols = req.query.symbols ? req.query.symbols.split(',').map((s) => s.trim().toUpperCase()) : undefined;
  const stocks = await marketService.getStocks(symbols);
  res.status(200).json({ status: 200, data: stocks });
});

const getEconomy = catchAsync(async (req, res) => {
  const economy = await marketService.getEconomy();
  res.status(200).json({ status: 200, data: economy });
});

const getNews = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  const news = await marketService.getNews(limit);
  res.status(200).json({ status: 200, data: news });
});

module.exports = { getStocks, getEconomy, getNews };
