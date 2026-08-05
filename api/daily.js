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

import { getDailyAstronomy, getBirthChart } from '../lib/astronomy/index.js'
import { buildAstroContext }                from '../lib/astrology/index.js'
import { buildDecisionObject, buildFamilyDecisionObject } from '../lib/decision/engine.js'

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

function parseUser(u) {
  if (!u || !u.name) return null
  const parts = (u.dob || '').split('-')
  const day   = parseInt(parts[0] || '1', 10)
  const month = parseInt(parts[1] || '1', 10)
  const year  = parseInt(parts[2] || '1990', 10)
  const [bh = 6, bm = 0] = (u.birth_time || '06:00').split(':').map(Number)
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null
  return { name: String(u.name).slice(0, 50), day, month, year, bh, bm }
}

// ─── Member assembly ──────────────────────────────────────────────────────────

function buildMember(name, decisionObj) {
  const d = decisionObj
  return {
    name,
    decision:      d.decision,
    confidence:    d.confidence,
    stars:         d.stars,
    focus:         d.focus,
    golden_window: d.goldenWindow,
    avoid_window:  d.avoidWindow,
    summary:       d.summary,
    recommendations: d.recommendations || { top: [], rest: [] },
    timeline:      d.timeline || [],
    dasha:         d.dasha || null,
    yoga:          d.yoga  || null
  }
}

// ─── Week plan ────────────────────────────────────────────────────────────────

function buildWeekPlan(targetDate, astroCtx, primarySeed) {
  const plan = []
  for (let offset = 0; offset < 7; offset++) {
    const d   = new Date(targetDate)
    d.setDate(d.getDate() + offset)
    try {
      const dayAstro = getDailyAstronomy(d)
      const dayCtx   = buildAstroContext(dayAstro, null, null, primarySeed)
      const dayDec   = buildDecisionObject(dayCtx, primarySeed, 0)
      const label    = d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })
      plan.push({
        label,
        date:       d.toISOString().slice(0, 10),
        days_ahead: offset,
        stars:      dayDec.stars,
        confidence: dayDec.confidenceScore || 50,
        summary:    dayDec.focus || 'Balanced day',
        theme:      dayDec.focus || null
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
    const chart  = getBirthChart(u.day, u.month, u.year, u.bh, u.bm)
    const ctx    = buildAstroContext(astroData, chart, feedbackAdj, primarySeed + idx)
    const dec    = buildDecisionObject(ctx, primarySeed + idx, 0)
    return buildMember(u.name, dec)
  })

  // Fallback primary member when no users are configured
  if (members.length === 0) {
    const ctx = buildAstroContext(astroData, null, feedbackAdj, 0)
    const dec = buildDecisionObject(ctx, 0, 0)
    members.push(buildMember('You', dec))
  }

  const familyAlignment = members.length > 1
    ? buildFamilyDecisionObject(members.map(m => ({ ...m, goldenWindow: m.golden_window, avoidWindow: m.avoid_window })))
    : null

  const weekPlan = buildWeekPlan(targetDate, astroData, primarySeed)
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
    week_plan:        weekPlan
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
    const targetDate    = new Date()
    if (daysAhead > 0) targetDate.setDate(targetDate.getDate() + daysAhead)

    const response = buildResponse(targetDate, req.body.users || [], req.body.feedbackAdj || null)
    return res.status(200).json(response)
  } catch (err) {
    // Log error details server-side, return safe message to client
    console.error('[/api/daily] Engine error:', err.message)
    return res.status(500).json({ error: 'Unable to generate daily guidance', code: 'ENGINE_ERROR' })
  }
}
