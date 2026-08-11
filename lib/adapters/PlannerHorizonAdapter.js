/**
 * /lib/adapters/PlannerHorizonAdapter.js
 *
 * Sprint 3: Adapter for raw /api/daily responses used by the Planner horizon fetch.
 *
 * PlannerScreen previously contained normaliseDayData() — a local business-logic
 * normaliser that bypassed the canonical adapter boundary (Constitution §17).
 * This adapter replaces it.
 *
 * Input: raw /api/daily JSON response with snake_case fields
 * Output: canonical HorizonDayDTO with camelCase fields
 *
 * HorizonDayDTO:
 * {
 *   daysAhead:        number
 *   stars:            1–5  (suitability)
 *   suitabilityScore: 0–100
 *   suitabilityTier:  'Excellent'|'Good'|'Neutral'|'Moderate'|'Challenging'
 *   confidenceScore:  0–100
 *   confidence:       'High'|'Medium'|'Low'
 *   decision:         'DO'|'WAIT'|'AVOID'
 *   goldenWindow:     'HH:MM–HH:MM' | null
 *   avoidWindow:      'HH:MM–HH:MM' | null
 *   focus:            string | null
 *   date:             'YYYY-MM-DD' | null
 *   members:          MemberSummaryDTO[]
 * }
 *
 * MemberSummaryDTO includes:
 *   scoredSlots:      ScoredSlot[]  — preserved for canonical activity scoring
 *   _reasoningResult: ReasoningResult | null — preserved for explainability
 */

const VALID_DECISIONS   = ['DO', 'WAIT', 'AVOID']
const VALID_CONFIDENCE  = ['High', 'Medium', 'Low']
const VALID_TIERS       = ['Excellent', 'Good', 'Neutral', 'Moderate', 'Challenging']

function normaliseMember(m) {
  if (!m) return null
  return {
    name:             m.name || null,
    stars:            typeof m.stars === 'number' ? m.stars : 3,
    suitabilityScore: typeof m.suitabilityScore === 'number' ? m.suitabilityScore : null,
    suitabilityTier:  VALID_TIERS.includes(m.suitabilityTier) ? m.suitabilityTier : null,
    confidence:       VALID_CONFIDENCE.includes(m.confidence) ? m.confidence : 'Medium',
    goldenWindow:     m.golden_window || m.goldenWindow || null,
    avoidWindow:      m.avoid_window  || m.avoidWindow  || null,
    focus:            m.focus || null,
    locationStatus:   m.locationStatus || 'unresolved',
    // Item 5 fix: preserve scoredSlots and _reasoningResult so that
    // lib/planning/activityPlanner.js can perform canonical slot-level scoring.
    // Without these fields, activityDayScore falls back to approximate mode.
    scoredSlots:      Array.isArray(m.scoredSlots) ? m.scoredSlots : [],
    _reasoningResult: m._reasoningResult || null
  }
}

/**
 * adaptHorizonDay(rawResponse, daysAhead)
 *
 * Converts a single raw /api/daily response to HorizonDayDTO.
 */
export function adaptHorizonDay(rawResponse, daysAhead) {
  if (!rawResponse || typeof rawResponse !== 'object') return null

  const primary = rawResponse.members?.[0] || null

  return {
    daysAhead:        typeof daysAhead === 'number' ? daysAhead : 0,
    date:             rawResponse.date || null,
    stars:            primary?.stars   ?? rawResponse.stars ?? 3,
    suitabilityScore: primary?.suitabilityScore ?? rawResponse.suitabilityScore ?? null,
    suitabilityTier:  VALID_TIERS.includes(primary?.suitabilityTier || rawResponse.suitabilityTier)
                        ? (primary?.suitabilityTier || rawResponse.suitabilityTier)
                        : null,
    confidenceScore:  primary?.confidenceScore ?? rawResponse.confidenceScore ?? null,
    confidence:       VALID_CONFIDENCE.includes(primary?.confidence || rawResponse.confidence)
                        ? (primary?.confidence || rawResponse.confidence)
                        : 'Medium',
    decision:         VALID_DECISIONS.includes(primary?.decision || rawResponse.decision)
                        ? (primary?.decision || rawResponse.decision)
                        : 'WAIT',
    goldenWindow:     primary?.golden_window || rawResponse.golden_window || null,
    avoidWindow:      primary?.avoid_window  || rawResponse.avoid_window  || null,
    focus:            primary?.focus || rawResponse.focus || null,
    members:          (rawResponse.members || []).map(normaliseMember).filter(Boolean)
  }
}

/**
 * adaptHorizonDays(rawResponses)
 *
 * Adapts an array of raw responses keyed by daysAhead.
 * rawResponses: Array of { daysAhead, ...rawResponse }
 */
export function adaptHorizonDays(rawResponses) {
  if (!Array.isArray(rawResponses)) return []
  return rawResponses
    .map(r => adaptHorizonDay(r, r.daysAhead))
    .filter(Boolean)
}
