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

/**
 * buildDailyInsight — canonical product calculation result.
 *
 * P0-1: This is the single authoritative output of the calculation pipeline.
 * api/daily.js builds this and serializes it to the API DTO.
 * All UI views derive from this. No parallel representations.
 *
 * P0-8: suitabilityScore and confidenceScore are always separate fields.
 * P0-9: Domain windows are explicitly labeled with their domain.
 * P0-10: Internal calculation objects (_panchang etc) are in calculationTrace,
 *         not in the main insight object.
 */
export function buildDailyInsight({ profileId, date, timezone, generatedAt,
  decisionObj, resolvedLocation, familyAlignment, weekPlan, name }) {
  const d = decisionObj
  const windows = buildWindowMap(d.scoredSlots)

  return {
    // ── Identity ─────────────────────────────────────────────────────────────
    profileId,
    name,
    date,
    timezone,
    calcVersion:    _CALC_VERSION,
    generatedAt,
    locationStatus: resolvedLocation?.status || 'unresolved',
    locationSource: resolvedLocation?.source  || 'default',

    // ── Overall day quality ───────────────────────────────────────────────────
    // P0-8: suitability and confidence are ALWAYS separate.
    overall: {
      suitabilityScore: d.suitabilityScore,
      suitabilityTier:  d.suitabilityTier,
      confidenceScore:  d.confidenceScore,
      confidenceTier:   d.confidence,   // 'High'|'Medium'|'Low'
      decision:         d.decision,
      stars:            d.stars,
      // Best windows
      goldenWindow:     d.goldenWindow,
      avoidWindow:      d.avoidWindow,
    },

    // ── Theme ─────────────────────────────────────────────────────────────────
    theme: d.focus,

    // ── Canonical time windows ────────────────────────────────────────────────
    // P0-9: _overall is the general best window.
    // Finance/property/shopping may have different windows (risk-inverted dim).
    // Each window key corresponds to a domain, or '_overall' for the day.
    windows,

    // ── Domain scores ─────────────────────────────────────────────────────────
    // P0-6: domains are NOT capped by overall score. Exceptions are explicit.
    // P0-9: each domain has its own bestWindow.
    domains: buildDomains(d, windows),

    // ── Recommendations ───────────────────────────────────────────────────────
    recommendations: d.recommendations || { top:[], rest:[] },
    signals:         d.signals         || { positive:[], caution:[], neutral:[] },
    reasons:         d.reasons         || [],

    // ── Timeline ──────────────────────────────────────────────────────────────
    timeline:  d.timeline || [],

    // ── Family alignment ──────────────────────────────────────────────────────
    familyAlignment,

    // ── Week plan ─────────────────────────────────────────────────────────────
    weekPlan,

    // ── Calculation trace (P0-10) ──────────────────────────────────────────────
    // Internal objects for diagnostics only. Never exposed through standard DTOs.
    calculationTrace: {
      scoredSlots:    d.scoredSlots    || [],
      panchang:       d._panchang      || null,
      dasha:          d._dasha         || null,
      yogas:          d._yogas         || [],
      lagna:          d._lagna         || null,
      nakshatraFx:    d._nakshatraFx   || null,
      tithiFx:        d._tithiFx       || null,
    }
  }
}

function buildDomains(d, windows) {
  const cats    = d._reasoningResult?.categories
  const overall = d.suitabilityScore || 50
  if (!cats) return {}
  return Object.fromEntries(
    Object.entries(cats).map(([cat, res]) => {
      // P0-6: compute domain-level suitabilityScore from reasoning quality/stars
      // Supportive = high score (mapped from evidence ratio via stars)
      // This is NOT capped by the overall day score
      const domainScore = domainScoreFromReasoning(res)
      const isException = Math.abs(domainScore - overall) >= 20
      const bestWindow  = windows[cat] || windows._overall || null
      const isDiffWindow = bestWindow !== windows._overall

      return [cat, {
        // P0-6: uncapped domain score
        suitabilityScore: domainScore,
        suitabilityTier:  res.quality === 'supportive' ? (res.stars >= 4 ? 'Good' : 'Neutral')
                         : res.quality === 'caution'   ? 'Challenging'
                         : 'Neutral',
        stars:      res.stars,
        quality:    res.quality,
        // P0-9: domain-specific window with explicit labeling
        bestWindow,
        windowLabel: isDiffWindow ? `Best ${cat} window` : 'Best window',
        isExceptionWindow: isDiffWindow,
        // P0-6: explicit exception flag and reason
        isException,
        exceptionReason: isException
          ? `${cat.charAt(0).toUpperCase()+cat.slice(1)} uses ${DOMAIN_DIM[cat]?.invert ? 'risk-minimising' : 'dimension-specific'} indicators that differ from overall timing.`
          : null,
        // Evidence
        keyFactors: res.keyFactors || [],
        trace:      res.trace || null
      }]
    })
  )
}

function domainScoreFromReasoning(res) {
  // Map evidence ratio → 0-100 score
  // stars from reasoning are 1-5 based on ratio bands
  // We map them back to a score range proportional to overall suitability
  const starMap = { 5:85, 4:70, 3:50, 2:30, 1:15 }
  return starMap[res.stars] || 50
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
