/**
 * Explainability Agent
 * Consumes the outputs of every prior agent in the pipeline and produces
 * a single, human-readable and machine-readable explanation package:
 * data used, step-by-step reasoning, confidence, alternatives, rejected
 * options, trade-offs, sources, and a decision tree.
 */

function buildDecisionTree(steps) {
  // Linear decision tree matching the required shape, each node carrying
  // a snippet of the reasoning that led to the next node.
  return steps.map((s, i) => ({
    step: i + 1,
    node: s.node,
    summary: s.summary,
    next: steps[i + 1] ? steps[i + 1].node : 'Final Recommendation',
  }));
}

function run({ profileResult, marketResult, newsResult, riskResult, portfolioResult }) {
  const startedAt = Date.now();

  const sources = [
    'Alpha Vantage (live pricing)',
    'Finnhub (company fundamentals)',
    'Yahoo Finance (sector performance)',
    'NewsAPI (financial news sentiment)',
    'FRED (US macroeconomic indicators)',
    'RBI (Indian monetary indicators)',
  ];

  const dataUsed = {
    profile: profileResult.output,
    market: {
      watchlist: marketResult.output.watchlist,
      stockCount: marketResult.output.stocks.length,
      economySnapshot: marketResult.output.economy,
    },
    news: {
      articlesAnalyzed: newsResult.output.articlesAnalyzed,
      overallSentiment: newsResult.output.overallSentiment,
    },
    risk: riskResult.output,
  };

  const reasoningTimeline = [
    { agent: 'ProfileAgent', reasoning: profileResult.reasoning, confidence: profileResult.confidence },
    { agent: 'MarketResearchAgent', reasoning: marketResult.reasoning, confidence: marketResult.confidence },
    { agent: 'NewsAnalysisAgent', reasoning: newsResult.reasoning, confidence: newsResult.confidence },
    { agent: 'RiskAssessmentAgent', reasoning: riskResult.reasoning, confidence: riskResult.confidence },
    { agent: 'PortfolioOptimizationAgent', reasoning: portfolioResult.reasoning, confidence: portfolioResult.confidence },
  ];

  const decisionTree = buildDecisionTree([
    { node: 'User Profile', summary: profileResult.reasoning },
    { node: 'Market Conditions', summary: marketResult.reasoning },
    { node: 'Economic Indicators', summary: `US GDP growth ${marketResult.output.economy.us.gdpGrowth}%, CPI ${marketResult.output.economy.us.cpi}%.` },
    { node: 'News Sentiment', summary: newsResult.reasoning },
    { node: 'Fundamental Analysis', summary: `Average metrics across ${marketResult.output.stocks.length} instruments informed company risk.` },
    { node: 'Risk Analysis', summary: riskResult.reasoning },
    { node: 'Portfolio Optimization', summary: portfolioResult.reasoning },
  ]);

  const tradeoffs = [
    `Chosen allocation balances a ${portfolioResult.output.expectedReturn}% expected return against a ` +
      `${portfolioResult.output.riskScore} risk score, consistent with a '${profileResult.output.riskProfile}' profile.`,
    ...portfolioResult.output.alternatives.map((a) => a.tradeoff),
  ];

  // Overall confidence: weighted average, with the Explainability Agent
  // itself not adding new uncertainty (it only reports on prior agents).
  const confidences = [
    profileResult.confidence,
    marketResult.confidence,
    newsResult.confidence,
    riskResult.confidence,
    portfolioResult.confidence,
  ];
  const overallConfidence = Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length);

  const reasonSummary =
    `Recommending a ${portfolioResult.output.allocation.map((a) => `${a.percentage}% ${a.assetClass}`).join(', ')} ` +
    `allocation with an expected annualized return of ${portfolioResult.output.expectedReturn}% and overall risk ` +
    `score of ${portfolioResult.output.riskScore}/100, based on the investor's ${profileResult.output.riskProfile} ` +
    `risk profile, current ${newsResult.output.overallSentiment} news sentiment, and prevailing macroeconomic conditions.`;

  const output = {
    reason: reasonSummary,
    confidence: overallConfidence,
    dataUsed,
    sources,
    tradeoffs,
    alternatives: portfolioResult.output.alternatives,
    rejected: portfolioResult.output.rejectedReasons,
    decisionTree,
    reasoningTimeline,
  };

  return {
    agentName: 'ExplainabilityAgent',
    output,
    reasoning: 'Aggregated and cross-referenced reasoning from all upstream agents into a transparent explanation package.',
    confidence: overallConfidence,
    durationMs: Date.now() - startedAt,
  };
}

module.exports = { run };
