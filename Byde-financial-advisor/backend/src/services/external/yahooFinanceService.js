const axios = require('axios');
const config = require('../../config');
const cache = require('../../utils/cache');
const logger = require('../../utils/logger');

async function requestWithRetry(url, params, retries = 2) {
  const cacheKey = `yahoo:${url}:${JSON.stringify(params)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const { data } = await axios.get(url, { params, timeout: 8000 });
      cache.set(cacheKey, data);
      return data;
    } catch (err) {
      lastError = err;
      logger.warn(`Yahoo Finance attempt ${attempt + 1} failed: ${err.message}`);
    }
  }
  throw lastError;
}

/** Fetches sector/market summary performance. */
async function getMarketSummary() {
  try {
    const url = `${config.externalApis.yahooFinanceBaseUrl}/v6/finance/quote/marketSummary`;
    const data = await requestWithRetry(url, { region: 'US', lang: 'en-US' });
    return { raw: data, source: 'yahoo_finance' };
  } catch (err) {
    logger.warn(`Yahoo Finance getMarketSummary fallback: ${err.message}`);
    return {
      sectors: [
        { name: 'Technology', changePercent: +(Math.random() * 3 - 1).toFixed(2) },
        { name: 'Financials', changePercent: +(Math.random() * 3 - 1).toFixed(2) },
        { name: 'Energy', changePercent: +(Math.random() * 3 - 1).toFixed(2) },
        { name: 'Healthcare', changePercent: +(Math.random() * 3 - 1).toFixed(2) },
        { name: 'Consumer Goods', changePercent: +(Math.random() * 3 - 1).toFixed(2) },
      ],
      source: 'yahoo_finance_mock',
    };
  }
}

module.exports = { getMarketSummary };
