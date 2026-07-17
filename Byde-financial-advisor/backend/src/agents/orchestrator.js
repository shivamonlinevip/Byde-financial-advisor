/**
 * Agent Orchestrator
 * Runs the fixed pipeline: Profile -> Market -> News -> Risk -> Portfolio
 * -> Explainability. Each agent's JSON output feeds the next. Every step
 * (input, output, reasoning, confidence, duration) is persisted to
 * DecisionHistory for full auditability, whether it succeeds or throws.
 */
const profileAgent = require('./profileAgent');
const marketResearchAgent = require('./marketResearchAgent');
const newsAnalysisAgent = require('./newsAnalysisAgent');
const riskAssessmentAgent = require('./riskAssessmentAgent');
const portfolioOptimizationAgent = require('./portfolioOptimizationAgent');
const explainabilityAgent = require('./explainabilityAgent');

const decisionHistoryService = require('../services/decisionHistoryService');
const Portfolio = require('../models/Portfolio');
const Recommendation = require('../models/Recommendation');
const logger = require('../utils/logger');

let status = {
  lastRunAt: null,
  lastRunUserId: null,
  lastRunStatus: 'idle', // idle | running | success | failed
  lastError: null,
};

async function logStep(userId, agentResult, input) {
  await decisionHistoryService.record({
    userId,
    agentName: agentResult.agentName,
    input,
    output: agentResult.output,
    reasoning: agentResult.reasoning,
    confidence: agentResult.confidence,
    durationMs: agentResult.durationMs,
  });
}

async function runPipeline(user, { watchlist } = {}) {
  status = { ...status, lastRunAt: new Date(), lastRunUserId: user._id, lastRunStatus: 'running', lastError: null };

  try {
    // 1. Profile Agent
    const profileResult = profileAgent.run(user);
    await logStep(user._id, profileResult, { user: user.toProfileJSON() });

    // 2. Market Research Agent
    const marketResult = await marketResearchAgent.run(profileResult.output, watchlist);
    await logStep(user._id, marketResult, { watchlist });

    // 3. News Analysis Agent
    const newsResult = await newsAnalysisAgent.run();
    await logStep(user._id, newsResult, {});

    // 4. Risk Assessment Agent
    const riskResult = riskAssessmentAgent.run(marketResult.output, newsResult.output);
    await logStep(user._id, riskResult, { market: marketResult.output, news: newsResult.output });

    // 5. Portfolio Optimization Agent
    const portfolioResult = portfolioOptimizationAgent.run(profileResult.output, riskResult.output, newsResult.output);
    await logStep(user._id, portfolioResult, {
      profile: profileResult.output,
      risk: riskResult.output,
      news: newsResult.output,
    });

    // 6. Explainability Agent
    const explainResult = explainabilityAgent.run({
      profileResult,
      marketResult,
      newsResult,
      riskResult,
      portfolioResult,
    });
    await logStep(user._id, explainResult, { note: 'aggregates all upstream agent outputs' });

    // Persist Portfolio + Recommendation
    const portfolio = await Portfolio.create({
      userId: user._id,
      allocation: portfolioResult.output.allocation,
      expectedReturn: portfolioResult.output.expectedReturn,
      riskScore: portfolioResult.output.riskScore,
      confidence: portfolioResult.confidence,
    });

    const recommendation = await Recommendation.create({
      userId: user._id,
      portfolio: portfolio._id,
      reason: explainResult.output.reason,
      confidence: explainResult.output.confidence,
      alternatives: explainResult.output.alternatives,
      rejectedReasons: explainResult.output.rejected,
      sources: explainResult.output.sources,
      tradeoffs: explainResult.output.tradeoffs,
      decisionTree: explainResult.output.decisionTree,
      reasoningTimeline: explainResult.output.reasoningTimeline,
    });

    status = { ...status, lastRunStatus: 'success', lastError: null };

    return {
      portfolio,
      recommendation,
      pipeline: {
        profile: profileResult,
        market: marketResult,
        news: newsResult,
        risk: riskResult,
        portfolioOptimization: portfolioResult,
        explainability: explainResult,
      },
    };
  } catch (err) {
    logger.error(`Agent pipeline failed for user ${user._id}: ${err.message}`);
    status = { ...status, lastRunStatus: 'failed', lastError: err.message };
    throw err;
  }
}

function getStatus() {
  return status;
}

module.exports = { runPipeline, getStatus };
