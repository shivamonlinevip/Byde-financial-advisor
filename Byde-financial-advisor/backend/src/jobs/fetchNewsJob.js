const cron = require('node-cron');
const marketService = require('../services/marketService');
const logger = require('../utils/logger');

function scheduleFetchNews() {
  // Every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    const startedAt = Date.now();
    try {
      const articles = await marketService.refreshNews();
      logger.info(`[job:fetchNews] Refreshed ${articles.length} articles in ${Date.now() - startedAt}ms`);
    } catch (err) {
      logger.error(`[job:fetchNews] Failed: ${err.message}`);
    }
  });
}

module.exports = scheduleFetchNews;
