/**
 * News Analysis Agent
 * Pulls recent financial news and produces an aggregate sentiment signal
 * with a confidence score derived from the strength/consistency of the
 * underlying signal (not just article count).
 */
const marketService = require('../services/marketService');

async function run() {
  const startedAt = Date.now();
  const news = await marketService.refreshNews();

  const counts = { positive: 0, negative: 0, neutral: 0 };
  news.forEach((n) => {
    counts[n.sentiment] = (counts[n.sentiment] || 0) + 1;
  });

  const total = news.length || 1;
  const netSentimentScore = ((counts.positive - counts.negative) / total) * 100; // -100..100

  let overallSentiment = 'neutral';
  if (netSentimentScore > 15) overallSentiment = 'positive';
  else if (netSentimentScore < -15) overallSentiment = 'negative';

  // Confidence is higher when sentiment is lopsided (clear signal) and
  // lower when articles are evenly split (ambiguous signal).
  const consistency = Math.abs(counts.positive - counts.negative) / total;
  const confidence = Math.round(50 + consistency * 45);

  const output = {
    articlesAnalyzed: news.length,
    counts,
    netSentimentScore: +netSentimentScore.toFixed(1),
    overallSentiment,
    topHeadlines: news.slice(0, 5).map((n) => ({
      headline: n.headline,
      sentiment: n.sentiment,
      source: n.source,
      url: n.url,
    })),
  };

  const reasoning =
    `Analyzed ${news.length} recent financial articles: ${counts.positive} positive, ` +
    `${counts.negative} negative, ${counts.neutral} neutral. Net sentiment score of ` +
    `${output.netSentimentScore} classifies overall market mood as '${overallSentiment}'.`;

  return {
    agentName: 'NewsAnalysisAgent',
    output,
    reasoning,
    confidence,
    durationMs: Date.now() - startedAt,
  };
}

module.exports = { run };
