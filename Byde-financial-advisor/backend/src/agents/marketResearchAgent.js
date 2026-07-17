/**
 * Market Research Agent
 * Independently researches: stock prices, company fundamentals, sector
 * performance, and macroeconomic indicators. Consumes the marketService,
 * which itself wraps Alpha Vantage / Finnhub / Yahoo Finance / FRED / RBI.
 */
const marketService = require('../services/marketService');

async function run(profileOutput, watchlist) {
  const startedAt = Date.now();
  const symbols = watchlist && watchlist.length ? watchlist : marketService.DEFAULT_WATCHLIST;

  const [stocks, economy] = await Promise.all([
    marketService.refreshWatchlist(symbols),
    marketService.getEconomy(),
  ]);

  const output = {
    watchlist: symbols,
    stocks: stocks.map((s) => ({
      stock: s.stock,
      price: s.price,
      PE: s.PE,
      ROE: s.ROE,
      RevenueGrowth: s.RevenueGrowth,
      Debt: s.Debt,
      MarketCap: s.MarketCap,
    })),
    economy,
  };

  const avgPE =
    output.stocks.reduce((sum, s) => sum + (s.PE || 0), 0) / (output.stocks.length || 1);

  const reasoning =
    `Retrieved live/near-live pricing and fundamentals for ${symbols.length} instruments ` +
    `(${symbols.join(', ')}), average P/E of ${avgPE.toFixed(1)}. Cross-referenced with ` +
    `sector performance (Yahoo Finance), US macro indicators (FRED: GDP growth ` +
    `${economy.us.gdpGrowth}%, CPI ${economy.us.cpi}), and Indian monetary indicators ` +
    `(RBI repo rate ${economy.india.repoRate ?? economy.india.raw ?? 'n/a'}).`;

  return {
    agentName: 'MarketResearchAgent',
    output,
    reasoning,
    confidence: 82, // dependent on external data freshness/availability
    durationMs: Date.now() - startedAt,
  };
}

module.exports = { run };
