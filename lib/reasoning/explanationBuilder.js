/**
 * /lib/reasoning/explanationBuilder.js
 *
 * Produces structured explanation metadata consumed by the language layer.
 * This is the bridge between the reasoning engine and /api/explain.js.
 *
 * NO natural language here — only structured facts.
 * The language layer (Claude) converts these into readable prose.
 */

/**
 * buildExplanationMetadata(reasoningResult, astroCtx, goldenWindow, avoidWindow)
 *
 * Returns ExplanationMetadata:
 * {
 *   decisionRationale:    string    — the primary reason in structured form (not prose)
 *   supportingFactors:    string[]  — what helped
 *   conflictingFactors:   string[]  — what opposed
 *   dominantFactor:       string    — the single most influential factor
 *   dashaContext:         string    — current life-period context
 *   nakshatraContext:     string    — today's nakshatra influence
 *   tithiContext:         string    — today's lunar day influence
 *   timing:               { best, avoid, reason }
 *   categoryHighlights:   { category, quality }[] — top 3 categories
 *   confidence:           'High'|'Medium'|'Low'
 *   conflictNote:         string|null
 * }
 */
export function buildExplanationMetadata(reasoningResult, astroCtx, goldenWindow, avoidWindow) {
  const { summary, conflictSummary, categories, confidence, topEvidence } = reasoningResult
  const { panchang } = astroCtx

  // Dominant factor
  const dominantFactor = topEvidence[0]
    ? `${topEvidence[0].subject} (${topEvidence[0].quality}, ${topEvidence[0].strength})`
    : 'Planetary alignment'

  // Supporting and conflicting factors
  const supporting  = topEvidence.filter(e => e.quality === 'supportive').slice(0, 2)
    .map(e => `${e.subject}: ${e.influence}`)
  const conflicting = topEvidence.filter(e => e.quality === 'challenging').slice(0, 1)
    .map(e => `${e.subject}: ${e.influence}`)

  // Category highlights (top 3 by stars)
  const catArray = Object.entries(categories)
    .sort((a, b) => (b[1].stars || 3) - (a[1].stars || 3))
    .slice(0, 3)
    .map(([cat, r]) => ({ category: cat, quality: r.quality, stars: r.stars }))

  // Dasha, nakshatra, tithi context
  const dashaNode    = (astroCtx.dasha?.currentLord || 'Jupiter') + ' Mahadasha / ' +
                       (astroCtx.dasha?.currentSub || 'Jupiter') + ' Antardasha'
  const nakshatraCtx = panchang?.nakshatra?.name
    ? `${panchang.nakshatra.name} (${astroCtx.nakshatraEffect?.label || 'influences today'})`
    : null
  const tithiCtx     = panchang?.tithi?.name
    ? `Tithi ${panchang.tithi.number} — ${panchang.tithi.name} (${panchang.tithi.phase} paksha)`
    : null

  // Decision rationale (structured key-value, not prose)
  const rationale = [
    `DECISION:${reasoningResult.decision}`,
    `DOMINANT:${dominantFactor}`,
    `DASHA:${dashaNode}`,
    panchang?.nakshatra?.name ? `NAKSHATRA:${panchang.nakshatra.name}` : null,
    panchang?.tithi?.name     ? `TITHI:${panchang.tithi.name}` : null
  ].filter(Boolean)

  return {
    decisionRationale:  rationale,
    supportingFactors:  supporting,
    conflictingFactors: conflicting,
    dominantFactor,
    dashaContext:       dashaNode,
    nakshatraContext:   nakshatraCtx,
    tithiContext:       tithiCtx,
    timing: { best: goldenWindow, avoid: avoidWindow, reason: summary?.primaryDriver?.influence || null },
    categoryHighlights: catArray,
    confidence,
    conflictNote:       conflictSummary?.balancingNote || null
  }
}
