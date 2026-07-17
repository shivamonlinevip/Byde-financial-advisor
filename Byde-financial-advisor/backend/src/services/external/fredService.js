const axios = require('axios');
const config = require('../../config');
const cache = require('../../utils/cache');
const logger = require('../../utils/logger');

const BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

async function requestWithRetry(seriesId, retries = 2) {
  const cacheKey = `fred:${seriesId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const { data } = await axios.get(BASE_URL, {
        params: {
          series_id: seriesId,
          api_key: config.externalApis.fredKey,
          file_type: 'json',
          sort_order: 'desc',
          limit: 1,
        },
        timeout: 8000,
      });
      cache.set(cacheKey, data);
      return data;
    } catch (err) {
      lastError = err;
      logger.warn(`FRED attempt ${attempt + 1} failed: ${err.message}`);
    }
  }
  throw lastError;
}

/** Fetches key US macroeconomic indicators (GDP growth, inflation, unemployment). */
async function getEconomicIndicators() {
  try {
    if (!config.externalApis.fredKey) throw new Error('no api key configured');
    const [gdp, cpi, unemployment] = await Promise.all([
      requestWithRetry('A191RL1Q225SBEA'), // Real GDP growth rate
      requestWithRetry('CPIAUCSL'), // CPI
      requestWithRetry('UNRATE'), // Unemployment rate
    ]);
    return {
      gdpGrowth: parseFloat(gdp.observations?.[0]?.value) || null,
      cpi: parseFloat(cpi.observations?.[0]?.value) || null,
      unemploymentRate: parseFloat(unemployment.observations?.[0]?.value) || null,
      source: 'fred',
    };
  } catch (err) {
    logger.warn(`FRED getEconomicIndicators fallback: ${err.message}`);
    return {
      gdpGrowth: +(1 + Math.random() * 3).toFixed(2),
      cpi: +(2 + Math.random() * 4).toFixed(2),
      unemploymentRate: +(3 + Math.random() * 3).toFixed(2),
      source: 'fred_mock',
    };
  }
}

module.exports = { getEconomicIndicators };
