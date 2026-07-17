const mongoose = require('mongoose');
const config = require('../index');
const logger = require('../../utils/logger');

let isConnected = false;

async function connectDatabase() {
  if (isConnected) return mongoose.connection;

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(config.mongoUri, {
      autoIndex: true,
    });
    isConnected = true;
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB disconnected');
    });

    return mongoose.connection;
  } catch (err) {
    logger.error(`MongoDB initial connection failed: ${err.message}`);
    throw err;
  }
}

async function disconnectDatabase() {
  await mongoose.disconnect();
  isConnected = false;
}

module.exports = { connectDatabase, disconnectDatabase };
