/**
 * Risk Assessment Agent
 * Combines market research + news sentiment output into a multi-factor
 * risk breakdown: market, company, sector, economic, and political risk,
 * then an overall weighted score (0-100, higher = riskier).
 */

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function run(marketOutput, newsOutput) {
  const startedAt = Date.now();
  const { stocks, economy } = marketOutput;

  // Market risk: driven by volatility proxy (spread of P/E ratios) and
  // negative news sentiment.
  const pes = stocks.map((s) => s.PE || 20);
  const avgPE = pes.reduce((a, b) => a + b, 0) / (pes.length || 1);
  const peVariance = pes.reduce((sum, pe) => sum + (pe - avgPE) ** 2, 0) / (pes.length || 1);
  const marketRisk = clamp(30 + Math.sqrt(peVariance) * 1.5 + (newsOutput.overallSentiment === 'negative' ? 15 : 0));

  // Company risk: driven by average debt levels and revenue growth trends.
  const avgDebt = stocks.reduce((sum, s) => sum + (s.Debt || 0), 0) / (stocks.length || 1);
  const avgRevenueGrowth = stocks.reduce((sum, s) => sum + (s.RevenueGrowth || 0), 0) / (stocks.length || 1);
  const companyRisk = clamp(20 + avgDebt * 15 - avgRevenueGrowth * 0.8);

  // Sector risk: dispersion across sector performance figures.
  const sectorChanges = (economy.sectors.sectors || []).map((s) => s.changePercent || 0);
  const sectorVariance =
    sectorChanges.reduce((sum, c) => sum + c ** 2, 0) / (sectorChanges.length || 1);
  const sectorRisk = clamp(25 + Math.sqrt(sectorVariance) * 8);

  // Economic risk: inflation (CPI) and unemployment pressure.
  const cpi = economy.us.cpi || 3;
  const unemployment = economy.us.unemploymentRate || 4;
  const economicRisk = clamp(15 + (cpi - 2) * 6 + (unemployment - 4) * 5);

  // Political risk: modeled here as a stable baseline plus a small
  // adjustment for monetary-policy tightening (higher repo rate implies
  // more restrictive/uncertain policy environment in this simplified model).
  const repoRate = economy.india.repoRate || 6.5;
  const politicalRisk = clamp(20 + (repoRate - 6) * 8);

  const weights = {
    market: 0.3,
    company: 0.25,
    sector: 0.15,
    economic: 0.2,
    political: 0.1,
  };

  const overallRiskScore = clamp(
    marketRisk * weights.market +
      companyRisk * weights.company +
      sectorRisk * weights.sector +
      economicRisk * weights.economic +
      politicalRisk * weights.political
  );

  const output = {
    marketRisk: +marketRisk.toFixed(1),
    companyRisk: +companyRisk.toFixed(1),
    sectorRisk: +sectorRisk.toFixed(1),
    economicRisk: +economicRisk.toFixed(1),
    politicalRisk: +politicalRisk.toFixed(1),
    overallRiskScore: +overallRiskScore.toFixed(1),
    weights,
  };

  const reasoning =
    `Computed weighted risk score of ${output.overallRiskScore}/100. Breakdown — ` +
    `market: ${output.marketRisk} (P/E dispersion + news sentiment), company: ${output.companyRisk} ` +
    `(avg debt/equity ${avgDebt.toFixed(2)}, revenue growth ${avgRevenueGrowth.toFixed(1)}%), ` +
    `sector: ${output.sectorRisk} (sector performance dispersion), economic: ${output.economicRisk} ` +
    `(CPI ${cpi}%, unemployment ${unemployment}%), political: ${output.politicalRisk} (policy rate ${repoRate}%).`;

  return {
    agentName: 'RiskAssessmentAgent',
    output,
    reasoning,
    confidence: 78,
    durationMs: Date.now() - startedAt,
  };
}

module.exports = { run };
