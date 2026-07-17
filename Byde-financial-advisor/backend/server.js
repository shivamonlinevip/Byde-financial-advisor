const app = require('./app');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const { connectDatabase } = require('./src/config/database/connect');
const initJobs = require('./src/jobs');

let server;

async function start() {
  await connectDatabase();

  server = app.listen(config.port, () => {
    logger.info(`Server listening on port ${config.port} [${config.env}]`);
    logger.info(`Swagger docs available at http://localhost:${config.port}/api/docs`);
  });

  initJobs();
}

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  if (server) server.close(() => process.exit(0));
});

start();
