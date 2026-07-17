const cron = require('node-cron');
const marketService = require('../services/marketService');
const logger = require('../utils/logger');

function scheduleUpdateMarketData() {
  // Every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    const startedAt = Date.now();
    try {
      const updated = await marketService.refreshWatchlist();
      logger.info(`[job:updateMarketData] Refreshed ${updated.length} instruments in ${Date.now() - startedAt}ms`);
    } catch (err) {
      logger.error(`[job:updateMarketData] Failed: ${err.message}`);
    }
  });
}

module.exports = scheduleUpdateMarketData;
