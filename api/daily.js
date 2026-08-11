/**
 * /api/daily.js — Main daily guidance API
 *
 * POST /api/daily
 * Body: { users: UserProfile[], feedbackAdj?: object, daysAhead?: number }
 * Returns: DailyAPIResponse
 *
 * Security: validates input, no raw engine objects in response, no secrets logged.
 * Performance: single execution path, no redundant computations.
 */

import { getDailyAstronomy, getBirthChart, getBirthChartFromParts } from '../lib/astronomy/index.js'
import { resolveBirthLocation, locationIsPersonalised } from '../lib/astronomy/birthLocation.js'
import { buildAstroContext }                from '../lib/astrology/index.js'
import { buildDecisionObject, buildFamilyDecisionObject } from '../lib/decision/engine.js'
import { CALC_VERSION } from '../lib/utils/version.js'

// ─── Validation ───────────────────────────────────────────────────────────────

function validateRequest(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' }
  }
  if (body.users !== undefined && !Array.isArray(body.users)) {
    return { valid: false, error: 'users must be an array' }
  }
  const daysAhead = Number(body.daysAhead ?? 0)
  if (isNaN(daysAhead) || daysAhead < 0 || daysAhead > 365) {
    return { valid: false, error: 'daysAhead must be a number between 0 and 365' }
  }
  return { valid: true, daysAhead }
}

// ─── User parsing ─────────────────────────────────────────────────────────────

/**
 * parseUser — validates and normalises an incoming user object.
 *
 * Constitution §9: missing birth date is NOT silently defaulted.
 * A user without a DOB is still parsed but flagged as unverified.
 * The engine will use the date with reduced confidence (locationStatus: 'unresolved').
 */
function parseUser(u) {
  if (!u || !u.name) return null
  const parts = (u.dob || '').split('-')
  const day   = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const year  = parseInt(parts[2], 10)
  // Missing or invalid DOB — flag but do not silently fabricate 01-01-1990
  const hasDob = !isNaN(day) && !isNaN(month) && !isNaN(year)
                 && day >= 1 && month >= 1 && year >= 1900 && year <= 2100
  const [bh = 6, bm = 0] = (u.birth_time || '06:00').split(':').map(Number)
  return {
    name:           String(u.name).slice(0, 50),
    day:            hasDob ? day   : null,
    month:          hasDob ? month : null,
    year:           hasDob ? year  : null,
    bh, bm,
    hasDob,         // explicit flag for downstream use
    place_of_birth: String(u.place_of_birth || '').slice(0, 100),
    timezone:       String(u.timezone || '').slice(0, 50)
  }
}

// ─── Member assembly ──────────────────────────────────────────────────────────

function buildMember(name, decisionObj, location = null) {
  const d = decisionObj
  return {
    name,
    decision:        d.decision,
    confidence:      d.confidence,
    confidenceScore: d.confidenceScore,
    stars:           d.stars,
    suitabilityScore:d.suitabilityScore,
    suitabilityTier: d.suitabilityTier,
    focus:           d.focus,
    golden_window:   d.goldenWindow,
    avoid_window:    d.avoidWindow,
    summary:         d.summary,
    recommendations: d.recommendations || { top: [], rest: [] },
    timeline:        d.timeline || [],
    dasha:           d.dasha || null,
    yoga:            d.yoga  || null,
    // P0-05: location precision status so UI/engine can flag limited personalisation
    locationStatus:  location?.status || 'unresolved',
    locationSource:  location?.source || 'default',
    // P0-07: scoredSlots passed through for family overlap calculation
    scoredSlots:     d.scoredSlots || []
  }
}

// ─── Week plan ────────────────────────────────────────────────────────────────

/**
 * buildWeekPlan — 7-day forward planner.
 *
 * Sprint 1 fixes (P0-03, P0-04):
 *   - Now receives birthChart so future days are personalised.
 *   - Uses suitabilityScore (slot-based raw score) not confidenceScore
 *     (which was absent and fell back to 50 for every day).
 *   - Fixed parameter order: daysAhead is now correctly offset, not primarySeed.
 */
function buildWeekPlan(targetDate, birthChart, userDob, primarySeed) {
  const plan = []
  for (let offset = 0; offset < 7; offset++) {
    const d   = new Date(targetDate)
    d.setDate(d.getDate() + offset)
    try {
      const dayAstro = getDailyAstronomy(d)
      // P0-04 fix: pass birthChart so natal chart is used for future days
      // P0-03 fix: pass correct offset as daysAhead (was incorrectly primarySeed)
      const dayCtx   = buildAstroContext(dayAstro, birthChart, userDob, offset)
      const dayDec   = buildDecisionObject(dayCtx, primarySeed, offset)
      const label    = d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })
      plan.push({
        label,
        date:            d.toISOString().slice(0, 10),
        days_ahead:      offset,
        // P0-01/P0-03 canonical suitability fields (not confidence)
        stars:           dayDec.stars,
        suitabilityScore:dayDec.suitabilityScore,
        suitabilityTier: dayDec.suitabilityTier,
        confidenceScore: dayDec.confidenceScore,
        confidence:      dayDec.confidence,
        decision:        dayDec.decision,
        golden_window:   dayDec.goldenWindow,
        avoid_window:    dayDec.avoidWindow,
        summary:         dayDec.focus || 'Balanced day',
        theme:           dayDec.focus || null
      })
    } catch {
      // Skip days that fail to compute rather than aborting the whole response
    }
  }
  return plan
}

// ─── Response builder ─────────────────────────────────────────────────────────

function buildResponse(targetDate, users, feedbackAdj) {
  const astroData  = getDailyAstronomy(targetDate)
  const userModels = users.map(parseUser).filter(Boolean)
  const primarySeed = userModels[0] ? hashUser(userModels[0]) : 0

  const members = userModels.map((u, idx) => {
    // P0-NEW-01 fix: use getBirthChartFromParts with numeric args (getBirthChart needs a string)
    // P0-05 fix: resolve birth location to canonical lat/lon with explicit precision status
    // Constitution §9: do not use chart if birth date is missing/invalid
    const location = resolveBirthLocation(u.place_of_birth, u.timezone)
    const chart  = u.hasDob
      ? getBirthChartFromParts(u.day, u.month, u.year, u.bh, u.bm, location.lat)
      : null  // explicit null — no silent default birth date
    const ctx    = buildAstroContext(astroData, chart, feedbackAdj, primarySeed + idx)
    const dec    = buildDecisionObject(ctx, primarySeed + idx, 0)
    return buildMember(u.name, dec, location)
  })

  // Fallback primary member when no users are configured
  if (members.length === 0) {
    const ctx = buildAstroContext(astroData, null, feedbackAdj, 0)
    const dec = buildDecisionObject(ctx, 0, 0)
    members.push(buildMember('You', dec))
  }

  const familyAlignment = members.length > 1
    ? buildFamilyDecisionObject(members.map(m => ({ ...m, goldenWindow: m.golden_window, avoidWindow: m.avoid_window, scoredSlots: m.scoredSlots || [] })))
    : null

  // P0-04 fix: pass primary user's birth chart to weekly plan calculation
  // P0-05 fix: also resolve primary user's location for accurate lagna
  // Constitution §9: only use birth chart when hasDob is verified
  const primaryLocation = userModels[0]
    ? resolveBirthLocation(userModels[0].place_of_birth, userModels[0].timezone)
    : null
  const primaryChart  = (userModels[0]?.hasDob) ? getBirthChartFromParts(
    userModels[0].day, userModels[0].month, userModels[0].year,
    userModels[0].bh, userModels[0].bm, primaryLocation?.lat
  ) : null
  const primaryDob    = userModels[0] ? `${userModels[0].day}-${userModels[0].month}-${userModels[0].year}` : null
  const weekPlan = buildWeekPlan(targetDate, primaryChart, primaryDob, primarySeed)
  const primary  = members[0]

  return {
    // Day-level summary
    golden_window:      primary.golden_window,
    avoid_window:       primary.avoid_window,
    confidence_summary: primary.confidence,
    focus:              primary.focus,
    stars:              primary.stars,
    // Astrology context (for display only)
    planet:    astroData.panchang?.vara?.name || null,
    nakshatra: astroData.panchang?.nakshatra?.name || null,
    tithi:     astroData.panchang?.tithi?.index || null,
    // Members and family
    members,
    family_alignment: familyAlignment,
    week_plan:        weekPlan,
    // Constitution §12: every response carries version + timestamp for traceability
    _meta: {
      calculationVersion: CALC_VERSION,
      generatedAt:        new Date().toISOString(),
      targetDate:         targetDate.toISOString().slice(0, 10),
      locationStatus:     primaryLocation?.status || 'unresolved'
    }
  }
}

// ─── Deterministic seed from user DOB ────────────────────────────────────────

function hashUser(u) {
  return (u.day * 31 + u.month * 37 + u.year) % 100
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  }

  const validation = validateRequest(req.body)
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error, code: 'INVALID_REQUEST' })
  }

  try {
    const { daysAhead } = validation
    // P0-06 fix: use client-provided calculationDate if available.
    // This prevents server timezone from determining user-facing daily calculations.
    // The client should pass the date as YYYY-MM-DD in the user's local timezone.
    // If not provided, fall back to server Date (documented limitation).
    let targetDate
    const clientDate = req.body.calculationDate   // expected: 'YYYY-MM-DD'
    if (clientDate && /^\d{4}-\d{2}-\d{2}$/.test(clientDate)) {
      // Parse as UTC midnight + daysAhead; astronomically equivalent for daily calc
      targetDate = new Date(clientDate + 'T00:00:00.000Z')
      if (daysAhead > 0) targetDate.setUTCDate(targetDate.getUTCDate() + daysAhead)
    } else {
      // Fallback: server local time (documented: may differ from user's local date near midnight)
      targetDate = new Date()
      if (daysAhead > 0) targetDate.setDate(targetDate.getDate() + daysAhead)
    }

    const response = buildResponse(targetDate, req.body.users || [], req.body.feedbackAdj || null)
    return res.status(200).json(response)
  } catch (err) {
    // Log error details server-side, return safe message to client
    console.error('[/api/daily] Engine error:', err.message)
    return res.status(500).json({ error: 'Unable to generate daily guidance', code: 'ENGINE_ERROR' })
  }
}
