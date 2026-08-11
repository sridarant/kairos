/**
 * /lib/models/DailyInsight.js — Canonical daily calculation result model.
 *
 * Sprint 3 — Items 3 + 4.
 * ONE CALCULATION → ONE CANONICAL MODEL → MANY VIEWS
 *
 * CALC_VERSION tracks the algorithm independently of the UI release version.
 */

// CALC_VERSION is the single authoritative source in lib/utils/version.js
import { CALC_VERSION as _CALC_VERSION } from '../utils/version.js'
// Re-export for backward compat (any file that imports CALC_VERSION from here)
export { CALC_VERSION } from '../utils/version.js'

const DOMAIN_DIM = {
  career:        { dim:'d', invert:false },
  finance:       { dim:'r', invert:true  },
  relationships: { dim:'c', invert:false },
  health:        { dim:'f', invert:false },
  learning:      { dim:'f', invert:false },
  travel:        { dim:'d', invert:false },
  spiritual:     { dim:'f', invert:false },
  home:          { dim:'f', invert:false },
  family:        { dim:'c', invert:false },
  shopping:      { dim:'r', invert:true  },
  medical:       { dim:'f', invert:false },
  communication: { dim:'c', invert:false },
  business:      { dim:'d', invert:false },
  property:      { dim:'r', invert:true  },
  legal:         { dim:'d', invert:false }
}

/**
 * buildWindowMap(scoredSlots)
 *
 * Derives canonical time windows per domain from slot scores.
 * Item 4 fix: finance/property/shopping use risk dim (inverted) — their best
 * window is legitimately different from the overall golden window.
 */
export function buildWindowMap(scoredSlots) {
  if (!scoredSlots?.length) return {}

  const sorted  = [...scoredSlots].sort((a, b) => b.score - a.score)
  const windows = { _overall: sorted[0]?.time || null }

  for (const [domain, cfg] of Object.entries(DOMAIN_DIM)) {
    const domSorted = [...scoredSlots].sort((a, b) =>
      cfg.invert
        ? (a.dims[cfg.dim] || 0) - (b.dims[cfg.dim] || 0)
        : (b.dims[cfg.dim] || 0) - (a.dims[cfg.dim] || 0)
    )
    const top     = domSorted[0]
    const allSame = domSorted.every(s => s.dims[cfg.dim] === top.dims[cfg.dim])
    windows[domain] = allSame ? windows._overall : top.time
  }

  return windows
}

export function buildDailyInsight({ profileId, date, timezone, generatedAt,
  decisionObj, resolvedLocation, familyAlignment, weekPlan }) {
  const d = decisionObj
  const windows = buildWindowMap(d.scoredSlots)

  return {
    profileId,
    date,
    timezone,
    calcVersion:    _CALC_VERSION,
    generatedAt,
    locationStatus: resolvedLocation?.status || 'unresolved',
    overall: {
      suitabilityScore: d.suitabilityScore,
      suitabilityTier:  d.suitabilityTier,
      confidenceScore:  d.confidenceScore,
      confidence:       d.confidence,
      decision:         d.decision,
      stars:            d.stars,
      goldenWindow:     d.goldenWindow,
      avoidWindow:      d.avoidWindow
    },
    theme:           d.focus,
    windows,
    domains:         buildDomains(d, windows),
    recommendations: d.recommendations || { top:[], rest:[] },
    signals:         d.signals,
    reasons:         d.reasons,
    timeline:        d.timeline,
    familyAlignment,
    weekPlan,
    _scoredSlots:    d.scoredSlots,
    _panchang:       d._panchang,
    _dasha:          d._dasha,
    _yogas:          d._yogas,
    _lagna:          d._lagna
  }
}

function buildDomains(d, windows) {
  const cats = d._reasoningResult?.categories
  if (!cats) return {}
  return Object.fromEntries(
    Object.entries(cats).map(([cat, res]) => [cat, {
      quality:    res.quality,
      stars:      res.stars,
      bestWindow: windows[cat] || windows._overall || null,
      keyFactors: res.keyFactors || [],
      trace:      res.trace || null
    }])
  )
}

export function validateDailyInsight(insight) {
  const errors = []
  if (!insight)                        errors.push('DailyInsight is null')
  if (!insight?.profileId)             errors.push('Missing profileId')
  if (!insight?.date)                  errors.push('Missing date')
  if (!insight?.calcVersion)           errors.push('Missing calcVersion')
  if (insight?.overall?.suitabilityScore == null) errors.push('Missing overall.suitabilityScore')
  return { valid: errors.length === 0, errors }
}
