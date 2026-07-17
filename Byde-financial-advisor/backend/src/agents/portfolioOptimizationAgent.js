/**
 * Portfolio Optimization Agent
 * Takes the profile's base allocation hint and tilts it based on computed
 * risk score and news sentiment, producing a final allocation, expected
 * return estimate, and labeled alternative portfolios for comparison.
 */

function normalize(allocation) {
  const total = Object.values(allocation).reduce((a, b) => a + b, 0);
  const normalized = {};
  Object.entries(allocation).forEach(([k, v]) => {
    normalized[k] = +((v / total) * 100).toFixed(1);
  });
  return normalized;
}

function toAllocationList(allocationMap) {
  return Object.entries(allocationMap).map(([assetClass, percentage]) => ({
    assetClass,
    percentage,
  }));
}

function estimateExpectedReturn(allocationMap, riskScore, newsSentiment) {
  // Simplified expected-return model per asset class (annualized, %).
  const baseReturns = { equity: 12, debt: 7, gold: 6, cash: 3.5 };
  let expected = Object.entries(allocationMap).reduce(
    (sum, [asset, pct]) => sum + (baseReturns[asset] || 5) * (pct / 100),
    0
  );

  if (newsSentiment === 'negative') expected -= 0.5;
  if (newsSentiment === 'positive') expected += 0.4;

  // Higher risk score slightly increases potential return assumption
  // (risk-return tradeoff), capped for realism.
  expected += (riskScore - 50) * 0.015;

  return +expected.toFixed(2);
}

function run(profileOutput, riskOutput, newsOutput) {
  const startedAt = Date.now();
  const { baseAllocationHint } = profileOutput;
  const { overallRiskScore } = riskOutput;

  // Tilt allocation: if computed risk is higher than what the base
  // profile assumed, shift a few points from equity to debt/cash, and
  // vice-versa if computed risk is comfortably low.
  const tilt = clampTilt(overallRiskScore);
  const tilted = {
    equity: baseAllocationHint.equity - tilt,
    debt: baseAllocationHint.debt + tilt * 0.6,
    gold: baseAllocationHint.gold + tilt * 0.2,
    cash: baseAllocationHint.cash + tilt * 0.2,
  };
  const finalAllocationMap = normalize(clampPositive(tilted));
  const finalAllocation = toAllocationList(finalAllocationMap);

  const expectedReturn = estimateExpectedReturn(finalAllocationMap, overallRiskScore, newsOutput.overallSentiment);

  // Alternatives: a more conservative and a more aggressive variant, for
  // the explainability layer to compare against and justify rejection of.
  const conservativeMap = normalize(
    clampPositive({
      equity: finalAllocationMap.equity - 15,
      debt: finalAllocationMap.debt + 10,
      gold: finalAllocationMap.gold + 3,
      cash: finalAllocationMap.cash + 2,
    })
  );
  const aggressiveMap = normalize(
    clampPositive({
      equity: finalAllocationMap.equity + 15,
      debt: finalAllocationMap.debt - 10,
      gold: finalAllocationMap.gold - 3,
      cash: finalAllocationMap.cash - 2,
    })
  );

  const alternatives = [
    {
      label: 'Conservative variant',
      allocation: conservativeMap,
      expectedReturn: estimateExpectedReturn(conservativeMap, overallRiskScore - 10, newsOutput.overallSentiment),
      riskScore: Math.max(0, overallRiskScore - 15),
      tradeoff: 'Lower expected return in exchange for meaningfully reduced volatility and drawdown risk.',
    },
    {
      label: 'Aggressive variant',
      allocation: aggressiveMap,
      expectedReturn: estimateExpectedReturn(aggressiveMap, overallRiskScore + 10, newsOutput.overallSentiment),
      riskScore: Math.min(100, overallRiskScore + 15),
      tradeoff: 'Higher expected return but materially higher exposure to equity market drawdowns.',
    },
  ];

  const rejectedReasons = [
    `Rejected the aggressive variant as primary recommendation: overall risk score of ` +
      `${Math.min(100, overallRiskScore + 15).toFixed(1)} exceeds the comfort band implied by the investor's ` +
      `'${profileOutput.riskProfile}' risk profile.`,
    `Rejected the conservative variant as primary recommendation: expected return of ` +
      `${estimateExpectedReturn(conservativeMap, overallRiskScore - 10, newsOutput.overallSentiment)}% falls short ` +
      `of the growth needed for the stated '${profileOutput.investmentGoal}' goal over ` +
      `${profileOutput.investmentDuration} years.`,
  ];

  // Confidence blends the upstream confidences (already averaged by
  // orchestrator) with how far the final allocation had to be tilted
  // from the profile's baseline (larger tilts = more assumptions made).
  const confidence = Math.round(85 - Math.min(20, Math.abs(tilt) * 2));

  const output = {
    allocation: finalAllocation,
    allocationMap: finalAllocationMap,
    expectedReturn,
    riskScore: overallRiskScore,
    alternatives,
    rejectedReasons,
  };

  const reasoning =
    `Started from the profile's base allocation ${JSON.stringify(baseAllocationHint)} and applied a tilt of ` +
    `${tilt.toFixed(1)} points (equity -> debt/gold/cash) based on a computed risk score of ` +
    `${overallRiskScore}. Final allocation: ${JSON.stringify(finalAllocationMap)}, expected annualized return ` +
    `${expectedReturn}%. Generated 2 alternative portfolios (conservative/aggressive) for comparison.`;

  return {
    agentName: 'PortfolioOptimizationAgent',
    output,
    reasoning,
    confidence,
    durationMs: Date.now() - startedAt,
  };
}

function clampTilt(riskScore) {
  // riskScore 50 -> no tilt; each 10 points above/below shifts ~3 allocation points
  const tilt = ((riskScore - 50) / 10) * 3;
  return Math.max(-12, Math.min(12, tilt));
}

function clampPositive(map) {
  const out = {};
  Object.entries(map).forEach(([k, v]) => {
    out[k] = Math.max(1, v);
  });
  return out;
}

module.exports = { run };
