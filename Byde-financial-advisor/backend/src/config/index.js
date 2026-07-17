require('dotenv').config();

const required = (value, fallback) => (value === undefined || value === '' ? fallback : value);

const config = {
  env: required(process.env.NODE_ENV, 'development'),
  port: parseInt(required(process.env.PORT, '5000'), 10),
  clientUrl: required(process.env.CLIENT_URL, 'http://localhost:3000'),

  mongoUri: required(process.env.MONGO_URI, 'mongodb://localhost:27017/explainable-financial-advisor'),

  jwt: {
    accessSecret: required(process.env.JWT_ACCESS_SECRET, 'dev_access_secret'),
    accessExpiresIn: required(process.env.JWT_ACCESS_EXPIRES_IN, '15m'),
    refreshSecret: required(process.env.JWT_REFRESH_SECRET, 'dev_refresh_secret'),
    refreshExpiresIn: required(process.env.JWT_REFRESH_EXPIRES_IN, '7d'),
  },

  rateLimit: {
    windowMs: parseInt(required(process.env.RATE_LIMIT_WINDOW_MS, '900000'), 10),
    max: parseInt(required(process.env.RATE_LIMIT_MAX, '200'), 10),
  },

  externalApis: {
    alphaVantageKey: required(process.env.ALPHA_VANTAGE_API_KEY, ''),
    finnhubKey: required(process.env.FINNHUB_API_KEY, ''),
    newsApiKey: required(process.env.NEWSAPI_API_KEY, ''),
    fredKey: required(process.env.FRED_API_KEY, ''),
    rbiBaseUrl: required(process.env.RBI_API_BASE_URL, 'https://rbi.org.in/api'),
    yahooFinanceBaseUrl: required(process.env.YAHOO_FINANCE_BASE_URL, 'https://query1.finance.yahoo.com'),
  },

  cache: {
    ttlSeconds: parseInt(required(process.env.CACHE_TTL_SECONDS, '300'), 10),
  },
};

module.exports = config;
