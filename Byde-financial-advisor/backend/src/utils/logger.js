const path = require('path');
const winston = require('winston');
const config = require('../config');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const consoleFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
  level: config.env === 'production' ? 'info' : 'debug',
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/agents.log'),
      level: 'debug',
    }),
  ],
});

if (config.env !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), errors({ stack: true }), consoleFormat),
    })
  );
}

module.exports = logger;
