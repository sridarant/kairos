/**
 * /lib/planning/horizonPlanner.js
 *
 * Canonical planning horizon calculator.
 * R2.3: Architecture for efficient, deterministic, activity-specific horizon calculation.
 *
 * One function, one pass through the requested days.
 * No sequential API calls. No redundant week-plan calculation.
 * No silently skipped days.
 *
 * Constitution §4: single source of truth for horizon calculation.
 * Constitution §5: no business logic in React.
 * Constitution §16: failed days are surfaced, not omitted.
 */

import { getDailyAstronomy, getBirthChartFromParts } from '../astronomy/index.js'
import { resolveBirthLocation }                       from '../astronomy/birthLocation.js'
import { buildAstroContext }                          from '../astrology/index.js'
import { buildDecisionObject }                        from '../decision/engine.js'
import { buildWindowMap }                             from '../models/DailyInsight.js'
import { activityDayScore, activityBestWindow,
         buildActivityExplanation, ACTIVITY_TYPES }   from './activityPlanner.js'

// ─── Types (JSDoc) ────────────────────────────────────────────────────────────
/**
 * @typedef {object} HorizonInput
 * @property {object[]}  users        — full canonical user profiles (with place_of_birth, timezone)
 * @property {Date}      startDate    — local date from which to count forward
 * @property {number}    days         — 7 or 14
 * @property {string?}   activityType — key from ACTIVITY_TYPES (affects ranking)
 */

/**
 * @typedef {object} HorizonDayResult
 * @property {string}   date
 * @property {number}   daysAhead
 * @property {'ok'|'failed'} status
 * @property {string?}  errorCategory
 * @property {number?}  suitabilityScore
 * @property {string?}  suitabilityTier
 * @property {number?}  activityScore    — activity-specific score (may differ from overall)
 * @property {string?}  activityWindow   — best window for this activity
 * @property {object?}  explanation      — why this day, from engine evidence
 */

/**
 * @typedef {object} HorizonResult
 * @property {HorizonDayResult[]} days
 * @property {HorizonDayResult?}  bestDate
 * @property {HorizonDayResult?}  alternateDate
 * @property {string?}            activityType
 * @property {string?}            activityLabel
 * @property {object}             meta
 */

// ─── Core ─────────────────────────────────────────────────────────────────────

/**
 * calculateHorizon(input)
 *
 * Canonical horizon calculation. Builds birth charts ONCE, calculates each
 * requested day exactly ONCE. Activity type affects day ranking and window selection.
 *
 * @param {HorizonInput} input
 * @returns {HorizonResult}
 */
export function calculateHorizon({ users, startDate, days, activityType }) {
  if (!startDate || !(startDate instanceof Date))
    throw new Error('startDate must be a Date')
  if (!days || days < 1 || days > 14)
    throw new Error('days must be 1–14')

  const actDef = activityType ? ACTIVITY_TYPES[activityType] : null

  // ── Resolve locations + build birth charts ONCE ───────────────────────────
  const resolvedLocations = (users || []).map(u =>
    resolveBirthLocation(u.place_of_birth || '', u.timezone || '')
  )
  const birthCharts = (users || []).map((u, i) => {
    const loc = resolvedLocations[i]
    const hasDob = u.dob && u.dob !== ''
    if (!hasDob) return null
    const parts = u.dob.split('-')
    const [day, month, year] = parts.map(Number)
    const [bh = 6, bm = 0] = (u.birth_time || '06:00').split(':').map(Number)
    if (!day || !month || !year || year < 1900) return null
    return getBirthChartFromParts(day, month, year, bh, bm, loc.lat, loc.lon, loc.tz)
  })

  // ── Calculate each day ────────────────────────────────────────────────────
  const primarySeed = _hashUsers(users)
  const horizonDays = []

  for (let i = 1; i <= days; i++) {
    const targetDate = new Date(startDate)
    targetDate.setDate(startDate.getDate() + i)
    const result = _calculateDay(targetDate, i, users, resolvedLocations, birthCharts, primarySeed, actDef)
    horizonDays.push(result)
  }

  // ── Rank and identify best/alternate ─────────────────────────────────────
  const calculated = horizonDays.filter(d => d.status === 'ok')
  const scored = actDef
    ? [...calculated].sort((a, b) => (b.activityScore ?? 0) - (a.activityScore ?? 0))
    : [...calculated].sort((a, b) => (b.suitabilityScore ?? 0) - (a.suitabilityScore ?? 0))

  return {
    days:          horizonDays,
    bestDate:      scored[0] || null,
    alternateDate: scored[1] || null,
    activityType:  actDef?.id    || null,
    activityLabel: actDef?.label || null,
    meta: {
      requestedDays:  days,
      calculatedDays: calculated.length,
      failedDays:     horizonDays.filter(d => d.status === 'failed').length,
      activityType:   actDef?.id || null,
      startDate:      startDate.toISOString().slice(0, 10),
    }
  }
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function _calculateDay(targetDate, daysAhead, users, resolvedLocations, birthCharts, primarySeed, actDef) {
  const dateStr = targetDate.toISOString().slice(0, 10)

  try {
    const astroData = getDailyAstronomy(targetDate)

    const memberResults = (users || []).map((u, idx) => {
      const loc = resolvedLocations[idx] || {}
      const chart = birthCharts[idx] || null
      const parts = (u.dob || '').split('-')
      const [d,m,y] = parts.map(Number)
      const userDobStr = (d && m && y && y > 1900) ? `${d}-${m}-${y}` : null
      const ctx = buildAstroContext(astroData, chart, userDobStr, 0, targetDate)
      const dec = buildDecisionObject(ctx, primarySeed + idx, 0)
      const windows = buildWindowMap(dec.scoredSlots)

      // Activity scoring: uses slot dims, not overall score
      const actScore  = actDef ? activityDayScore({ members:[{ ...dec, scoredSlots:dec.scoredSlots }] }, actDef) : null
      const actWindow = actDef ? activityBestWindow(dec.scoredSlots, actDef) : null
      const actExpl   = actDef ? buildActivityExplanation({ members:[{ ...dec, scoredSlots:dec.scoredSlots, _reasoningResult:dec._reasoningResult }] }, actDef) : null

      return {
        name:             u.name || null,
        stars:            dec.stars,
        suitabilityScore: dec.suitabilityScore,
        suitabilityTier:  dec.suitabilityTier,
        confidenceScore:  dec.confidenceScore,
        confidence:       dec.confidence,
        decision:         dec.decision,
        golden_window:    dec.goldenWindow,
        avoid_window:     dec.avoidWindow,
        focus:            dec.focus,
        windows,
        scoredSlots:      dec.scoredSlots,
        _reasoningResult: dec._reasoningResult,
        locationStatus:   loc.status || 'unresolved',
        activityScore:    actScore?.score      ?? null,
        activityWindow:   actWindow            ?? null,
        activityApprox:   actScore?.isApproximate ?? true,
        explanation:      actExpl              ?? null,
      }
    })

    const primary = memberResults[0] || {}

    return {
      date:             dateStr,
      daysAhead,
      status:           'ok',
      stars:            primary.stars,
      suitabilityScore: primary.suitabilityScore,
      suitabilityTier:  primary.suitabilityTier,
      confidenceScore:  primary.confidenceScore,
      confidence:       primary.confidence,
      decision:         primary.decision,
      golden_window:    primary.golden_window,
      avoid_window:     primary.avoid_window,
      focus:            primary.focus,
      windows:          primary.windows,
      scoredSlots:      primary.scoredSlots,
      _reasoningResult: primary._reasoningResult,
      activityScore:    primary.activityScore,
      activityWindow:   primary.activityWindow,
      activityApprox:   primary.activityApprox,
      explanation:      primary.explanation,
      members:          memberResults,
    }

  } catch (err) {
    // Constitution §16: failed days are surfaced, not silently omitted
    return {
      date:             dateStr,
      daysAhead,
      status:           'failed',
      errorCategory:    err?.name || 'CalculationError',
      stars:            null,
      suitabilityScore: null,
      suitabilityTier:  null,
      golden_window:    null,
      avoid_window:     null,
      activityScore:    null,
      activityWindow:   null,
      explanation:      null,
      members:          [],
    }
  }
}

function _hashUsers(users) {
  if (!users?.length) return 42
  const u = users[0]
  const parts = (u.dob || '').split('-').map(Number)
  const [d = 1, m = 1, y = 1970] = parts
  return (d * 31 + m * 37 + y) % 100
}
