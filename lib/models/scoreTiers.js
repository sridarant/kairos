/**
 * /lib/models/scoreTiers.js — Canonical score → tier → label mapping.
 *
 * P0-7: ONE mapping used by every screen. No per-component label logic.
 *
 * Constitution §4: one source of truth.
 * Constitution §7: canonical metrics must remain distinct.
 *
 * Suitability and confidence use the SAME tier names but are SEPARATE metrics.
 * The functions below accept a score and return { tier, stars, label }.
 *
 * IMPORTANT: suitability scores come from rawScoreToSuitability() in engine.js.
 * Confidence scores come from computeConfidence() in confidence.js.
 * They are numerically comparable (both 0-100) but semantically different.
 */

// ─── Suitability tiers ────────────────────────────────────────────────────────
// Score range: 0-100 (from rawScoreToSuitability calibration: min=1, max=15 raw)

export const SUITABILITY_TIERS = Object.freeze({
  Excellent:   { min:80, stars:5, label:'Exceptional',  shortLabel:'Exceptional' },
  Good:        { min:60, stars:4, label:'Strong',        shortLabel:'Strong' },
  Neutral:     { min:40, stars:3, label:'Moderate',      shortLabel:'Moderate' },
  Moderate:    { min:20, stars:2, label:'Challenging',   shortLabel:'Challenging' },
  Challenging: { min: 0, stars:1, label:'Caution',       shortLabel:'Caution' },
})

export function suitabilityToTier(score) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Neutral'
  if (score >= 20) return 'Moderate'
  return 'Challenging'
}

export function suitabilityToStars(score) {
  return SUITABILITY_TIERS[suitabilityToTier(score)]?.stars || 3
}

export function suitabilityLabel(score) {
  return SUITABILITY_TIERS[suitabilityToTier(score)]?.label || 'Neutral day'
}

// ─── Confidence tiers ─────────────────────────────────────────────────────────
// Score range: 0-100 (from computeConfidence())

export const CONFIDENCE_TIERS = Object.freeze({
  High:   { min:70, label:'High confidence'   },
  Medium: { min:45, label:'Moderate confidence'},
  Low:    { min: 0, label:'Lower confidence'  },
})

export function confidenceToTier(score) {
  if (score >= 70) return 'High'
  if (score >= 45) return 'Medium'
  return 'Low'
}

// ─── Domain exception detection ───────────────────────────────────────────────
// P0-6/P0-9: A domain is an exception when its score substantially differs
// from the overall day score (not a workaround — a feature).

const EXCEPTION_THRESHOLD = 20  // domain score must differ by ≥20 to be flagged

export function isDomainException(domainScore, overallScore) {
  return Math.abs(domainScore - overallScore) >= EXCEPTION_THRESHOLD
}

export function domainExceptionReason(domainScore, overallScore, domainName) {
  if (!isDomainException(domainScore, overallScore)) return null
  const direction = domainScore > overallScore ? 'stronger' : 'weaker'
  return `${domainName} conditions are ${direction} than the overall day — this domain uses different astrological indicators.`
}

// ─── Window quality labels ─────────────────────────────────────────────────────
// Used by TimelineSection and domain window display

export function windowQualityLabel(quality) {
  const map = {
    Excellent:    'Best',
    Good:         'Good',
    Neutral:      '',
    Moderate:     '',
    'Low energy': 'Low',
  }
  return map[quality] ?? ''
}
