/**
 * Profile Agent
 * Reads the user's stored profile (risk tolerance, goal, amount, duration)
 * and normalizes it into a structured shape the rest of the pipeline
 * consumes. Deliberately simple/rule-based so its output is fully
 * explainable — no black-box scoring here.
 */

const RISK_WEIGHTS = {
  conservative: { equity: 0.3, debt: 0.55, gold: 0.1, cash: 0.05 },
  moderate: { equity: 0.55, debt: 0.3, gold: 0.1, cash: 0.05 },
  aggressive: { equity: 0.75, debt: 0.15, gold: 0.07, cash: 0.03 },
};

function run(user) {
  const startedAt = Date.now();

  const baseAllocationHint = RISK_WEIGHTS[user.riskProfile] || RISK_WEIGHTS.moderate;

  const horizonBucket =
    user.investmentDuration <= 2 ? 'short_term' : user.investmentDuration <= 7 ? 'medium_term' : 'long_term';

  const output = {
    userId: user._id ? user._id.toString() : user.id,
    riskProfile: user.riskProfile,
    investmentGoal: user.investmentGoal,
    investmentAmount: user.investmentAmount,
    investmentDuration: user.investmentDuration,
    horizonBucket,
    baseAllocationHint,
  };

  const reasoning =
    `Classified investor as '${user.riskProfile}' risk profile with a '${horizonBucket}' ` +
    `time horizon (${user.investmentDuration} years) targeting '${user.investmentGoal}'. ` +
    `This maps to a base allocation hint of ${JSON.stringify(baseAllocationHint)} before ` +
    `market, news, and risk adjustments are applied.`;

  return {
    agentName: 'ProfileAgent',
    output,
    reasoning,
    confidence: 95, // deterministic, rule-based -> high confidence
    durationMs: Date.now() - startedAt,
  };
}

module.exports = { run };
