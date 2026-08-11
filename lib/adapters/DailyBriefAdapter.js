/**
 * /lib/adapters/DailyBriefAdapter.js
 *
 * Converts raw DailyBrief (from lib/dailyBrief/index.js) into a validated DailyBrief DTO.
 * Normalises all field names. Populates defaults. Never returns null for required fields.
 */

import { validateDailyBrief } from './validate.js'

const VALID_OUTLOOK = new Set(['Positive', 'Neutral', 'Challenging'])
const VALID_CONF    = new Set(['High', 'Medium', 'Low', 'Very High'])

/**
 * adaptOpportunity(raw) → BriefOpportunity
 */
function adaptOpportunity(raw) {
  if (!raw) return null
  return {
    category:   raw.category   || 'general',
    icon:       raw.icon       || '📌',
    label:      raw.label      || raw.category || 'Opportunity',
    advice:     raw.advice     || raw.action   || raw.recommendation || raw.summary || '',
    confidence: VALID_CONF.has(raw.confidence) ? raw.confidence : 'Medium',
    bestTime:   raw.bestTime   || raw.best_time || raw.bestWindow || null
  }
}

/**
 * adaptCaution(raw) → BriefCaution
 */
function adaptCaution(raw) {
  if (!raw) return null
  return {
    category:   raw.category   || 'general',
    icon:       raw.icon       || '⚠️',
    label:      raw.label      || raw.category || 'Caution',
    advice:     raw.advice     || raw.action   || raw.recommendation || raw.summary || '',
    confidence: VALID_CONF.has(raw.confidence) ? raw.confidence : 'Medium'
  }
}

/**
 * adaptFamilyBrief(raw) → FamilyBrief | null
 */
function adaptFamilyBrief(raw) {
  if (!raw) return null
  return {
    energy:     raw.energy     || 'Moderate',
    bestWindow: raw.bestWindow || raw.best_window || raw.bestSharedWindow || raw.best_shared_window || null,
    activities: Array.isArray(raw.activities) ? raw.activities : (raw.recommended || []),
    avoid:      Array.isArray(raw.avoid) ? raw.avoid : [],
    confidence: VALID_CONF.has(raw.confidence) ? raw.confidence : 'Medium',
    memberCount: raw.memberCount || 0
  }
}

/**
 * adaptTomorrowPreview(raw) → TomorrowPreview | null
 */
export function adaptTomorrowPreview(raw) {
  if (!raw) return null
  const conf = VALID_CONF.has(raw.confidence) ? raw.confidence
    : raw.stars >= 4 ? 'High' : raw.stars >= 3 ? 'Medium' : 'Low'
  return {
    label:      raw.label      || 'Tomorrow',
    stars:      typeof raw.stars === 'number' ? raw.stars : 3,
    summary:    raw.summary    || '',
    confidence: conf,
    bestWindow: raw.bestWindow || raw.best_window || null,
    theme:      raw.theme      || null,
    daysAhead:  raw.daysAhead  ?? raw.days_ahead  ?? 1
  }
}

/**
 * adaptDailyBrief(raw, dailyApiResponse) → DailyBrief DTO
 *
 * raw = output of buildMorningBrief()
 * dailyApiResponse = raw /api/daily response (used as fallback)
 */
export function adaptDailyBrief(raw, dailyApiResponse) {
  if (!raw && !dailyApiResponse) return null

  const daily   = dailyApiResponse || {}
  const primary = daily.members?.[0] || {}

  // Derive stars from primary member or daily-level
  const stars    = raw?.stars || primary.stars || daily.stars || 3
  const outlook  = VALID_OUTLOOK.has(raw?.outlook) ? raw.outlook : 'Neutral'
  const conf     = VALID_CONF.has(raw?.confidence) ? raw.confidence
    : (primary.confidence || daily.confidence_summary || 'Medium')

  // P0-5 fix: include suitabilityTier and suitabilityScore from the daily API response.
  // Previously these were lost here and the UI fell back to stars-derived inference.
  // daily.suitabilityScore and daily.suitabilityTier come from the P0-1 DTO output.
  const suitabilityScore = daily.suitabilityScore ?? primary?.suitabilityScore ?? null
  const suitabilityTier  = daily.suitabilityTier  ?? primary?.suitabilityTier  ?? null

  const brief = {
    theme:          raw?.theme          || daily.focus || primary.focus || 'Decision Making',
    outlook,
    bestWindow:     raw?.bestWindow     || daily.golden_window || primary.golden_window || null,
    avoidWindow:    raw?.avoidWindow    || daily.avoid_window  || primary.avoid_window  || null,
    confidence:     conf,
    stars,
    // P0-5: canonical suitability fields — never inferred from stars
    suitabilityScore,
    suitabilityTier,
    // P0-8: confidence score separately
    confidenceScore: daily.overall?.confidenceScore ?? primary?.confidenceScore ?? null,
    confidenceTier:  daily.overall?.confidenceTier  ?? primary?.confidence      ?? conf,
    summary:        raw?.decisionOfDay  || primary.summary  || daily.why   || null,
    decisionOfDay:  raw?.decisionOfDay  || null,
    watchFor:       raw?.watchFor       || null,
    opportunities:  (raw?.opportunities || []).map(adaptOpportunity).filter(Boolean),
    cautions:       (raw?.cautions      || []).map(adaptCaution).filter(Boolean),
    familyBrief:    adaptFamilyBrief(raw?.familyBrief || (daily.family_alignment ? {
      energy:     (daily.family_alignment.stars || 3) >= 4 ? 'High' : 'Moderate',
      bestWindow: daily.family_alignment.best_shared_window || daily.family_alignment.bestSharedWindow,
      activities: daily.family_alignment.recommended || [],
      avoid:      daily.family_alignment.avoid || [],
      confidence: daily.family_alignment.confidence || 'Medium'
    } : null)),
    tomorrowPreview: adaptTomorrowPreview(raw?.tomorrowPreview || null)
  }

  const { valid, issues } = validateDailyBrief(brief)
  if (!valid) {

    console.warn('[DailyBriefAdapter] Brief has issues:', issues)
  }

  return brief
}
