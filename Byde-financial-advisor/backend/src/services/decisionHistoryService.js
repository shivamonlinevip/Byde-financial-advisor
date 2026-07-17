const DecisionHistory = require('../models/DecisionHistory');

/**
 * Logs a single agent execution. Called by the orchestrator after every
 * agent runs, regardless of success/failure.
 */
async function record({ userId, agentName, input, output, reasoning, confidence, durationMs, error = null }) {
  return DecisionHistory.create({
    userId,
    agentName,
    input,
    output,
    reasoning,
    confidence,
    durationMs,
    error,
    timestamp: new Date(),
  });
}

async function getHistoryForUser(userId, limit = 50) {
  return DecisionHistory.find({ userId }).sort({ timestamp: -1 }).limit(limit);
}

module.exports = { record, getHistoryForUser };
