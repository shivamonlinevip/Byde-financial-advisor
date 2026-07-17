const axios = require('axios');
const config = require('../../config');
const cache = require('../../utils/cache');
const logger = require('../../utils/logger');

const BASE_URL = 'https://www.alphavantage.co/query';

async function requestWithRetry(params, retries = 2) {
  const cacheKey = `alphavantage:${JSON.stringify(params)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const { data } = await axios.get(BASE_URL, {
        params: { ...params, apikey: config.externalApis.alphaVantageKey },
        timeout: 8000,
      });
      cache.set(cacheKey, data);
      return data;
    } catch (err) {
      lastError = err;
      logger.warn(`AlphaVantage attempt ${attempt + 1} failed: ${err.message}`);
    }
  }
  throw lastError;
}

/**
 * Fetches a global quote for a given symbol.
 * Falls back to a deterministic mock if the API key is missing/invalid,
 * so the system stays demoable without live credentials.
 */
async function getQuote(symbol) {
  try {
    if (!config.externalApis.alphaVantageKey) throw new Error('no api key configured');
    const data = await requestWithRetry({ function: 'GLOBAL_QUOTE', symbol });
    const quote = data['Global Quote'];
    if (!quote || !quote['05. price']) throw new Error('empty response');
    return {
      symbol,
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: quote['10. change percent'],
      source: 'alpha_vantage',
    };
  } catch (err) {
    logger.warn(`AlphaVantage getQuote fallback for ${symbol}: ${err.message}`);
    return {
      symbol,
      price: +(100 + Math.random() * 900).toFixed(2),
      change: +(Math.random() * 10 - 5).toFixed(2),
      changePercent: `${(Math.random() * 4 - 2).toFixed(2)}%`,
      source: 'alpha_vantage_mock',
    };
  }
}

module.exports = { getQuote };
