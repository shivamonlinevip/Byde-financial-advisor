const Portfolio = require('../models/Portfolio');
const Recommendation = require('../models/Recommendation');
const ApiError = require('../utils/ApiError');

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Applies macro shocks to a base portfolio to project a new expected
 * return / risk / allocation, with an explanation of each adjustment.
 * Kept as simple, transparent arithmetic rather than a black-box model
 * so every shift is traceable to a specific input.
 */
function applyScenario(basePortfolio, scenario) {
  const { inflation, interestRate, marketCrash, GDPGrowth } = scenario;
  const notes = [];

  let returnAdjustment = 0;
  let riskAdjustment = 0;

  // Inflation above ~4% erodes real returns and raises risk.
  if (inflation > 4) {
    const excess = inflation - 4;
    returnAdjustment -= excess * 0.4;
    riskAdjustment += excess * 1.2;
    notes.push(`Inflation of ${inflation}% (${excess.toFixed(1)}pts above the 4% comfort baseline) erodes real returns and adds volatility.`);
  } else {
    notes.push(`Inflation of ${inflation}% is within the comfort baseline; minimal drag on returns.`);
  }

  // Higher interest rates typically pressure equity valuations and bond prices.
  if (interestRate > 6) {
    const excess = interestRate - 6;
    returnAdjustment -= excess * 0.5;
    riskAdjustment += excess * 1.0;
    notes.push(`Interest rate of ${interestRate}% above the 6% baseline pressures equity valuations and existing bond prices.`);
  } else {
    notes.push(`Interest rate of ${interestRate}% is at/below baseline; supportive for valuations.`);
  }

  // GDP growth is broadly supportive of equity returns when positive.
  returnAdjustment += GDPGrowth * 0.3;
  riskAdjustment -= GDPGrowth > 0 ? GDPGrowth * 0.5 : 0;
  if (GDPGrowth < 0) riskAdjustment += Math.abs(GDPGrowth) * 1.5;
  notes.push(`GDP growth of ${GDPGrowth}% ${GDPGrowth >= 0 ? 'supports' : 'weighs on'} corporate earnings and equity risk premia.`);

  // A market crash flag is the most severe shock: sharp equity drawdown.
  if (marketCrash) {
    returnAdjustment -= 8;
    riskAdjustment += 25;
    notes.push('Market crash scenario applied: equity holdings assumed to take a sharp near-term drawdown, materially raising portfolio risk.');
  }

  const newExpectedReturn = +(basePortfolio.expectedReturn + returnAdjustment).toFixed(2);
  const newRiskScore = +clamp(basePortfolio.riskScore + riskAdjustment).toFixed(1);

  // Under stress (crash or high risk), tilt allocation defensively;
  // otherwise keep allocation unchanged for this simplified projection.
  let newAllocation = basePortfolio.allocation;
  if (marketCrash || newRiskScore > 75) {
    newAllocation = basePortfolio.allocation.map((a) => {
      if (a.assetClass === 'equity') return { ...a.toObject?.() ?? a, percentage: Math.max(10, a.percentage - 15) };
      if (a.assetClass === 'debt') return { ...a.toObject?.() ?? a, percentage: a.percentage + 10 };
      if (a.assetClass === 'cash') return { ...a.toObject?.() ?? a, percentage: a.percentage + 5 };
      return a.toObject?.() ?? a;
    });
    notes.push('Simulated defensive rebalancing: shifted allocation from equity toward debt/cash given elevated stress conditions.');
  }

  let recommendation;
  if (newRiskScore > 75) {
    recommendation = 'Reduce equity exposure and increase allocation to debt/cash until conditions stabilize.';
  } else if (newExpectedReturn < 5) {
    recommendation = 'Expected returns are compressed under this scenario; consider extending time horizon or accepting a more conservative mix.';
  } else {
    recommendation = 'Current allocation strategy remains reasonable under this scenario; continue with periodic monitoring.';
  }

  return {
    newPortfolio: newAllocation,
    expectedReturn: newExpectedReturn,
    risk: newRiskScore,
    recommendation,
    explanation: notes,
  };
}

async function simulate(userId, scenarioInput) {
  let portfolio;
  if (scenarioInput.recommendationId) {
    const rec = await Recommendation.findOne({ _id: scenarioInput.recommendationId, userId }).populate('portfolio');
    if (!rec) throw ApiError.notFound('Recommendation not found');
    portfolio = rec.portfolio;
  } else {
    portfolio = await Portfolio.findOne({ userId }).sort({ createdAt: -1 });
  }

  if (!portfolio) {
    throw ApiError.notFound('No portfolio found to simulate against. Run /api/portfolio/analyze first.');
  }

  return applyScenario(portfolio, scenarioInput);
}

module.exports = { simulate, applyScenario };
