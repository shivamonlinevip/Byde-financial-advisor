const axios = require('axios');
const config = require('../../config');
const cache = require('../../utils/cache');
const logger = require('../../utils/logger');

const BASE_URL = 'https://finnhub.io/api/v1';

async function requestWithRetry(path, params, retries = 2) {
  const cacheKey = `finnhub:${path}:${JSON.stringify(params)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const { data } = await axios.get(`${BASE_URL}${path}`, {
        params: { ...params, token: config.externalApis.finnhubKey },
        timeout: 8000,
      });
      cache.set(cacheKey, data);
      return data;
    } catch (err) {
      lastError = err;
      logger.warn(`Finnhub attempt ${attempt + 1} failed: ${err.message}`);
    }
  }
  throw lastError;
}

/** Fetches basic company fundamentals for a symbol. */
async function getFundamentals(symbol) {
  try {
    if (!config.externalApis.finnhubKey) throw new Error('no api key configured');
    const data = await requestWithRetry('/stock/metric', { symbol, metric: 'all' });
    const m = data.metric || {};
    return {
      symbol,
      PE: m.peBasicExclExtraTTM ?? null,
      ROE: m.roeTTM ?? null,
      RevenueGrowth: m.revenueGrowthTTMYoy ?? null,
      Debt: m.totalDebtToEquityQuarterly ?? null,
      MarketCap: m.marketCapitalization ?? null,
      source: 'finnhub',
    };
  } catch (err) {
    logger.warn(`Finnhub getFundamentals fallback for ${symbol}: ${err.message}`);
    return {
      symbol,
      PE: +(10 + Math.random() * 30).toFixed(2),
      ROE: +(5 + Math.random() * 25).toFixed(2),
      RevenueGrowth: +(Math.random() * 20 - 2).toFixed(2),
      Debt: +(Math.random() * 2).toFixed(2),
      MarketCap: Math.round(1000 + Math.random() * 500000),
      source: 'finnhub_mock',
    };
  }
}

module.exports = { getFundamentals };
