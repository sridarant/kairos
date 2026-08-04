// /lib/decision/confidence.js
// Derives a 3-tier confidence model from multi-layer astro signal agreement.
// Never exposes percentages externally — only High / Medium / Low.

/**
 * scoreToTier: convert numeric confidence (0–100) to a label
 */
export function scoreToTier(score) {
  if (score >= 70) return 'High'
  if (score >= 45) return 'Medium'
  return 'Low'
}

/**
 * computeConfidence: aggregate layer signals into a confidence score (0–100).
 *
 * Each factor has a max contribution. Factors that agree → add; factors
 * that conflict → subtract (weighted conflict resolution).
 *
 * Factors:
 *  - transitAgreement:  do transits support the dominant dimension?
 *  - nakshatraStrength: nakshatra delta magnitude
 *  - tithiPhase:        peak/growth phases boost, closure/declining reduce
 *  - lagnaAlignment:    lagna sign matches golden-slot dimension
 *  - spreadScore:       best-vs-worst slot spread (larger = clearer signal)
 *  - familyAlignment:   when multiple members, harmony adds confidence
 */
export function computeConfidence({
  spreadScore,         // number: best.score - worst.score
  transitAgreement,    // boolean: transits favour dominant dimension
  nakshatraDelta,      // number: magnitude of nakshatra influence
  tithiPhase,          // string: 'Dashami'|'Panchami'|'Pratipada'|'Declining'|'Closing'
  lagnaAligned,        // boolean
  familyHarmony,       // number 0–100 or null
  daysAhead            // number: future-date penalty
}) {
  let score = 40 // baseline

  // Spread: larger spread = clearer winner (max +30)
  const spreadContrib = Math.min(30, Math.round(spreadScore * 6))
  score += spreadContrib

  // Transit agreement (max +15)
  if (transitAgreement) score += 15

  // Nakshatra magnitude (max +10)
  score += Math.min(10, Math.round(Math.abs(nakshatraDelta || 0) * 3))

  // Tithi phase (max ±10)
  const tithiBonus = { Dashami:10, Panchami:6, Pratipada:4, Declining:-4, Closing:-8 }
  score += (tithiBonus[tithiPhase] || 0)

  // Lagna alignment (+8)
  if (lagnaAligned) score += 8

  // Family harmony (max +7 when aligned)
  if (familyHarmony != null) {
    score += Math.round(((familyHarmony - 50) / 50) * 7)
  }

  // Future-date penalty
  const futurePenalty = daysAhead === 0 ? 0 : daysAhead <= 3 ? 12 : 22
  score -= futurePenalty

  const clamped = Math.max(10, Math.min(95, score))
  return { score: clamped, tier: scoreToTier(clamped), stars: scoreToStars(clamped) }
}

export function scoreToStars(score) {
  if (score >= 82) return 5
  if (score >= 68) return 4
  if (score >= 52) return 3
  if (score >= 36) return 2
  return 1
}
