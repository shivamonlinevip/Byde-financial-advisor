const cron = require('node-cron');
const User = require('../models/User');
const orchestrator = require('../agents/orchestrator');
const logger = require('../utils/logger');

function scheduleRecalculatePortfolios() {
  // Daily at 02:00 server time
  cron.schedule('0 2 * * *', async () => {
    const startedAt = Date.now();
    let succeeded = 0;
    let failed = 0;

    try {
      const users = await User.find({});
      for (const user of users) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await orchestrator.runPipeline(user);
          succeeded += 1;
        } catch (err) {
          failed += 1;
          logger.error(`[job:recalculatePortfolios] Failed for user ${user._id}: ${err.message}`);
        }
      }
      logger.info(
        `[job:recalculatePortfolios] Completed: ${succeeded} succeeded, ${failed} failed, ${Date.now() - startedAt}ms`
      );
    } catch (err) {
      logger.error(`[job:recalculatePortfolios] Fatal error: ${err.message}`);
    }
  });
}

module.exports = scheduleRecalculatePortfolios;
