const axios = require('axios');
const config = require('../../config');
const cache = require('../../utils/cache');
const logger = require('../../utils/logger');

const BASE_URL = 'https://newsapi.org/v2/everything';

const MOCK_HEADLINES = [
  { headline: 'Markets rally as inflation cools more than expected', sentiment: 'positive' },
  { headline: 'Central bank signals cautious stance on rate cuts', sentiment: 'neutral' },
  { headline: 'Tech earnings disappoint, shares slide in after-hours trading', sentiment: 'negative' },
  { headline: 'Manufacturing output rebounds amid strong export demand', sentiment: 'positive' },
  { headline: 'Regulatory uncertainty weighs on financial sector outlook', sentiment: 'negative' },
];

async function requestWithRetry(params, retries = 2) {
  const cacheKey = `newsapi:${JSON.stringify(params)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const { data } = await axios.get(BASE_URL, {
        params: { ...params, apiKey: config.externalApis.newsApiKey },
        timeout: 8000,
      });
      cache.set(cacheKey, data);
      return data;
    } catch (err) {
      lastError = err;
      logger.warn(`NewsAPI attempt ${attempt + 1} failed: ${err.message}`);
    }
  }
  throw lastError;
}

/** Fetches recent financial news articles for a query/topic. */
async function getFinancialNews(query = 'stock market') {
  try {
    if (!config.externalApis.newsApiKey) throw new Error('no api key configured');
    const data = await requestWithRetry({
      q: query,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: 10,
    });
    return (data.articles || []).map((a) => ({
      headline: a.title,
      summary: a.description,
      source: a.source?.name,
      url: a.url,
      publishedAt: a.publishedAt,
    }));
  } catch (err) {
    logger.warn(`NewsAPI getFinancialNews fallback: ${err.message}`);
    return MOCK_HEADLINES.map((h, i) => ({
      headline: h.headline,
      summary: `${h.headline} - full coverage unavailable in offline mode.`,
      source: 'mock_source',
      url: `https://example.com/news/${i}`,
      publishedAt: new Date(Date.now() - i * 3600 * 1000).toISOString(),
      _mockSentiment: h.sentiment,
    }));
  }
}

module.exports = { getFinancialNews };
