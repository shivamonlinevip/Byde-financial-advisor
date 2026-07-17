const MarketData = require('../models/MarketData');
const News = require('../models/News');
const alphaVantageService = require('./external/alphaVantageService');
const finnhubService = require('./external/finnhubService');
const yahooFinanceService = require('./external/yahooFinanceService');
const newsApiService = require('./external/newsApiService');
const fredService = require('./external/fredService');
const rbiService = require('./external/rbiService');

const DEFAULT_WATCHLIST = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ITC'];

/** Fetches live quote + fundamentals for a symbol and upserts MarketData. */
async function refreshStock(symbol) {
  const [quote, fundamentals] = await Promise.all([
    alphaVantageService.getQuote(symbol),
    finnhubService.getFundamentals(symbol),
  ]);

  const doc = await MarketData.findOneAndUpdate(
    { stock: symbol },
    {
      stock: symbol,
      price: quote.price,
      PE: fundamentals.PE,
      ROE: fundamentals.ROE,
      RevenueGrowth: fundamentals.RevenueGrowth,
      Debt: fundamentals.Debt,
      MarketCap: fundamentals.MarketCap,
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return doc;
}

async function refreshWatchlist(symbols = DEFAULT_WATCHLIST) {
  return Promise.all(symbols.map(refreshStock));
}

async function getStocks(symbols) {
  const query = symbols && symbols.length ? { stock: { $in: symbols } } : {};
  const stocks = await MarketData.find(query).sort({ updatedAt: -1 }).limit(50);
  if (stocks.length === 0) {
    return refreshWatchlist(symbols && symbols.length ? symbols : DEFAULT_WATCHLIST);
  }
  return stocks;
}

async function getEconomy() {
  const [sectors, us, india] = await Promise.all([
    yahooFinanceService.getMarketSummary(),
    fredService.getEconomicIndicators(),
    rbiService.getMonetaryIndicators(),
  ]);

  return {
    sectors,
    us,
    india,
  };
}

function classifySentiment(article) {
  if (article._mockSentiment) return article._mockSentiment;
  const text = `${article.headline || ''} ${article.summary || ''}`.toLowerCase();
  const positiveWords = ['rally', 'growth', 'surge', 'gain', 'beat', 'strong', 'record', 'rebound'];
  const negativeWords = ['fall', 'drop', 'slide', 'loss', 'weak', 'decline', 'crash', 'concern', 'miss'];
  let score = 0;
  positiveWords.forEach((w) => {
    if (text.includes(w)) score += 1;
  });
  negativeWords.forEach((w) => {
    if (text.includes(w)) score -= 1;
  });
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

async function refreshNews(query = 'stock market') {
  const articles = await newsApiService.getFinancialNews(query);
  const docs = await Promise.all(
    articles.map((a) =>
      News.findOneAndUpdate(
        { headline: a.headline },
        {
          headline: a.headline,
          summary: a.summary,
          sentiment: classifySentiment(a),
          source: a.source,
          url: a.url,
          publishedAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
        },
        { upsert: true, new: true }
      )
    )
  );
  return docs;
}

async function getNews(limit = 20) {
  const existing = await News.find().sort({ publishedAt: -1 }).limit(limit);
  if (existing.length === 0) {
    return refreshNews();
  }
  return existing;
}

module.exports = {
  DEFAULT_WATCHLIST,
  refreshStock,
  refreshWatchlist,
  getStocks,
  getEconomy,
  refreshNews,
  getNews,
};
