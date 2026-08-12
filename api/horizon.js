/**
 * /api/horizon.js — Canonical planning horizon endpoint.
 *
 * R2.3 Sprint: ONE request for 7 or 14 day horizon.
 *
 * BEFORE: PlannerScreen made 7-14 sequential /api/daily calls.
 *         Each /api/daily ran buildWeekPlan (7 more calculations).
 *         7-day horizon: 56 day-calculations, all serial.
 *         14-day horizon: 112 day-calculations, all serial.
 *
 * AFTER: ONE request calculates exactly the requested days.
 *        7-day horizon: 7 day-calculations.
 *        14-day horizon: 14 day-calculations.
 *        Reduction: ~8x fewer calculations.
 *
 * Contract:
 *   Request: { users: UserProfile[], days: 7|14, startDate: 'YYYY-MM-DD', activityType?: string }
 *   Response: { days: HorizonDayDTO[], meta: HorizonMeta }
 *
 * Constitution §9: No silent defaults for missing birth data.
 * Constitution §5: No business logic in React.
 * Constitution §16: Failed days are surfaced, not silently skipped.
 */

import { getDailyAstronomy, getBirthChartFromParts } from '../lib/astronomy/index.js'
import { resolveBirthLocation }                       from '../lib/astronomy/birthLocation.js'
import { buildAstroContext }                          from '../lib/astrology/index.js'
import { buildDecisionObject }                        from '../lib/decision/engine.js'
import { buildWindowMap }                             from '../lib/models/DailyInsight.js'
import { CALC_VERSION }                               from '../lib/utils/version.js'
import { activityDayScore, activityBestWindow,
         ACTIVITY_TYPES }                             from '../lib/planning/activityPlanner.js'

// ─── Input validation ─────────────────────────────────────────────────────────

const MAX_DAYS = 14
const MIN_DAYS = 1

function validateRequest(body) {
  if (!body || typeof body !== 'object')
    return { valid:false, error:'Missing request body' }

  const days = parseInt(body.days, 10)
  if (isNaN(days) || days < MIN_DAYS || days > MAX_DAYS)
    return { valid:false, error:`days must be between ${MIN_DAYS} and ${MAX_DAYS}` }

  if (body.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(body.startDate))
    return { valid:false, error:'startDate must be YYYY-MM-DD' }

  if (body.activityType && !ACTIVITY_TYPES[body.activityType])
    return { valid:false, error:`Unknown activityType: ${body.activityType}` }

  if (body.users && !Array.isArray(body.users))
    return { valid:false, error:'users must be an array' }

  return { valid:true, days }
}

// ─── User parsing (mirrors api/daily.js parseUser) ───────────────────────────

function parseUser(u) {
  if (!u || !u.name) return null
  const parts = (u.dob || '').split('-')
  const day   = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const year  = parseInt(parts[2], 10)
  const hasDob = !isNaN(day) && !isNaN(month) && !isNaN(year)
                 && day >= 1 && month >= 1 && year >= 1900 && year <= 2100
  const [bh = 6, bm = 0] = (u.birth_time || '06:00').split(':').map(Number)
  return {
    name:           String(u.name).slice(0, 50),
    day:            hasDob ? day   : null,
    month:          hasDob ? month : null,
    year:           hasDob ? year  : null,
    bh, bm, hasDob,
    place_of_birth: String(u.place_of_birth || '').slice(0, 100),
    timezone:       String(u.timezone       || '').slice(0, 50)
  }
}

function hashUser(u) {
  return u.hasDob ? (u.day * 31 + u.month * 37 + u.year) % 100 : 0
}

// ─── Single-day horizon calculation ──────────────────────────────────────────

function calculateDay(targetDate, userModels, resolvedLocations, birthCharts, actDef) {
  const dateStr = targetDate.toISOString().slice(0, 10)

  try {
    const astroData = getDailyAstronomy(targetDate)
    const primarySeed = userModels[0] ? hashUser(userModels[0]) : 42

    const members = userModels.map((u, idx) => {
      const location = resolvedLocations[idx]
      const chart    = birthCharts[idx]
      const userDobStr = u.hasDob ? `${u.day}-${u.month}-${u.year}` : null
      const ctx  = buildAstroContext(astroData, chart, userDobStr, 0, targetDate)
      const dec  = buildDecisionObject(ctx, primarySeed + idx, 0)
      const windows = buildWindowMap(dec.scoredSlots)

      // Activity-specific scoring (P0 — activity affects ranking)
      const activityScore  = actDef ? activityDayScore({ members:[{ ...dec, scoredSlots:dec.scoredSlots }] }, actDef) : null
      const activityWindow = actDef ? activityBestWindow(dec.scoredSlots, actDef) : null

      return {
        name:             u.name,
        stars:            dec.stars,
        suitabilityScore: dec.suitabilityScore,
        suitabilityTier:  dec.suitabilityTier,
        confidenceScore:  dec.confidenceScore,
        confidence:       dec.confidence,
        decision:         dec.decision,
        golden_window:    dec.goldenWindow,
        avoid_window:     dec.avoidWindow,
        focus:            dec.focus,
        summary:          dec.summary,
        windows,
        scoredSlots:      dec.scoredSlots,
        _reasoningResult: dec._reasoningResult,
        locationStatus:   location?.status || 'unresolved',
        // Activity-specific fields (P0 — distinct from overall)
        activityScore:    activityScore?.score      ?? null,
        activityWindow:   activityWindow            ?? null,
        activityApprox:   activityScore?.isApproximate ?? true,
      }
    })

    const primary = members[0]

    return {
      date:    dateStr,
      status:  'ok',
      // Overall day (from primary user)
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
      // Activity-specific (P0)
      activityScore:    primary.activityScore,
      activityWindow:   primary.activityWindow,
      activityApprox:   primary.activityApprox,
      members,
    }
  } catch (err) {
    // P0: failed days are surfaced, not silently skipped
    return {
      date:        dateStr,
      status:      'failed',
      errorCategory: err?.name || 'CalculationError',
      // Null but present — UI distinguishes Calculated vs Unavailable
      stars:            null,
      suitabilityScore: null,
      suitabilityTier:  null,
      golden_window:    null,
      avoid_window:     null,
      activityScore:    null,
      activityWindow:   null,
      members:          [],
    }
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error:'Method not allowed' })
  }

  const validation = validateRequest(req.body)
  if (!validation.valid) {
    return res.status(400).json({ error:validation.error })
  }

  const { days } = validation
  const activityType = req.body.activityType || null
  const actDef = activityType ? ACTIVITY_TYPES[activityType] : null

  // Determine start date: client-provided or server today
  let startDate
  const clientStart = req.body.startDate
  if (clientStart && /^\d{4}-\d{2}-\d{2}$/.test(clientStart)) {
    startDate = new Date(clientStart + 'T00:00:00Z')
  } else {
    startDate = new Date()
    startDate.setHours(0, 0, 0, 0)
  }

  // Parse and validate all users once
  const rawUsers = Array.isArray(req.body.users) ? req.body.users.slice(0, 6) : []
  const userModels = rawUsers.map(parseUser).filter(Boolean)

  // Resolve locations and build birth charts ONCE (not per day)
  const resolvedLocations = userModels.map(u =>
    resolveBirthLocation(u.place_of_birth, u.timezone)
  )
  const birthCharts = userModels.map((u, idx) => {
    const loc = resolvedLocations[idx]
    return u.hasDob
      ? getBirthChartFromParts(u.day, u.month, u.year, u.bh, u.bm, loc.lat, loc.lon, loc.tz)
      : null
  })

  // Calculate each day in the horizon (ONE pass)
  const generatedAt = new Date().toISOString()
  const horizonDays = []

  for (let i = 1; i <= days; i++) {
    const targetDate = new Date(startDate)
    targetDate.setUTCDate(startDate.getUTCDate() + i)
    const dayResult = calculateDay(targetDate, userModels, resolvedLocations, birthCharts, actDef)
    horizonDays.push({ ...dayResult, daysAhead: i })
  }

  // Sort for best-date identification
  const calculated = horizonDays.filter(d => d.status === 'ok')
  const scored = actDef
    ? [...calculated].sort((a, b) => (b.activityScore ?? 0) - (a.activityScore ?? 0))
    : [...calculated].sort((a, b) => (b.suitabilityScore ?? 0) - (a.suitabilityScore ?? 0))

  const bestDate      = scored[0] || null
  const alternateDate = scored[1] || null

  return res.status(200).json({
    days:          horizonDays,    // all requested days, in order, with status
    bestDate,
    alternateDate,
    activityType,
    activityLabel: actDef?.label || null,
    meta: {
      calculationVersion: CALC_VERSION,
      generatedAt,
      startDate:          startDate.toISOString().slice(0, 10),
      requestedDays:      days,
      calculatedDays:     calculated.length,
      failedDays:         horizonDays.filter(d => d.status === 'failed').length,
      activityType,
    }
  })
}
