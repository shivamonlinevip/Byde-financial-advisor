const scheduleUpdateMarketData = require('./updateMarketDataJob');
const scheduleFetchNews = require('./fetchNewsJob');
const scheduleRecalculatePortfolios = require('./recalculatePortfoliosJob');
const logger = require('../utils/logger');

function initJobs() {
  scheduleUpdateMarketData();
  scheduleFetchNews();
  scheduleRecalculatePortfolios();
  logger.info('Background jobs scheduled: updateMarketData (15m), fetchNews (10m), recalculatePortfolios (daily 02:00)');
}

module.exports = initJobs;
