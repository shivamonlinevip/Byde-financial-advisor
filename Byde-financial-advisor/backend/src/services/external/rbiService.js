const axios = require('axios');
const config = require('../../config');
const cache = require('../../utils/cache');
const logger = require('../../utils/logger');

async function requestWithRetry(path, retries = 2) {
  const cacheKey = `rbi:${path}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const { data } = await axios.get(`${config.externalApis.rbiBaseUrl}${path}`, {
        timeout: 8000,
      });
      cache.set(cacheKey, data);
      return data;
    } catch (err) {
      lastError = err;
      logger.warn(`RBI attempt ${attempt + 1} failed: ${err.message}`);
    }
  }
  throw lastError;
}

/** Fetches Indian monetary policy indicators (repo rate, inflation, forex reserves). */
async function getMonetaryIndicators() {
  try {
    const data = await requestWithRetry('/monetary-policy/current');
    return { raw: data, source: 'rbi' };
  } catch (err) {
    logger.warn(`RBI getMonetaryIndicators fallback: ${err.message}`);
    return {
      repoRate: +(6 + Math.random()).toFixed(2),
      inflationRate: +(4 + Math.random() * 3).toFixed(2),
      forexReservesUsdBn: Math.round(550 + Math.random() * 100),
      source: 'rbi_mock',
    };
  }
}

module.exports = { getMonetaryIndicators };
