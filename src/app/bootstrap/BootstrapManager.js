/**
 * /src/app/bootstrap/BootstrapManager.js
 *
 * Bootstrap sequence:
 *   1. identityManager.load()     — synchronous, reads kairos_identity_v1
 *   2. identityManager.trackOpen() — increments session count
 *   3. fetchDailyAPI(users)        — async, personalised if identity exists
 *   4. buildApplicationDTOs()      — pure data transformation
 *
 * No intermediate states. No fallback to Demo if a valid identity exists.
 * Nothing in this file touches localStorage directly.
 */

import { identityManager }                              from '../../identity/IdentityManager.js'
import { buildDailyPackages }                           from '../../../lib/recommendations/index.js'
import { rankRecommendations }                          from '../../../lib/recommendations/recommendationRanker.js'
import { buildWeeklyPlan, buildUpcomingOpportunities } from '../../../lib/recommendations/weeklyPlanner.js'
import { buildMorningBrief }                           from '../../../lib/dailyBrief/index.js'
import {
  adaptRecommendations, adaptDailyBrief, adaptTimeline,
  adaptWeeklyPlan, adaptOpportunities, buildDiagnostics
} from '../../../lib/adapters/index.js'

// ─── Date context ─────────────────────────────────────────────────────────────

export function buildDateContext(daysAhead = 0) {
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  const target = new Date(base)
  target.setDate(target.getDate() + daysAhead)
  const fmt = (d, opts) => d.toLocaleDateString('en-US', opts)
  return {
    date:          target.toISOString().slice(0, 10),
    daysAhead,
    isToday:       daysAhead === 0,
    isTomorrow:    daysAhead === 1,
    relativeLabel: daysAhead === 0 ? 'Today'
      : daysAhead === 1 ? 'Tomorrow'
      : daysAhead > 0   ? `In ${daysAhead} days` : `${Math.abs(daysAhead)} days ago`,
    weekday:      fmt(target, { weekday:'long' }),
    dayMonth:     fmt(target, { day:'numeric', month:'long' }),
    fullDate:     fmt(target, { weekday:'long', day:'numeric', month:'long', year:'numeric' }),
    shortDate:    fmt(target, { day:'numeric', month:'short' }),
    iso:          target.toISOString().slice(0, 10),
    weekLabel:    `Week of ${fmt(base, { day:'numeric', month:'short' })}–${fmt(new Date(base.getTime() + 6 * 86400000), { day:'numeric', month:'short', year:'numeric' })}`,
    monthLabel:   fmt(target, { month:'long', year:'numeric' })
  }
}

// ─── API ──────────────────────────────────────────────────────────────────────

export async function fetchDailyAPI(users, daysAhead = 0) {
  const res = await fetch('/api/daily', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ users: users || [], daysAhead })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// ─── DTO pipeline ─────────────────────────────────────────────────────────────

export function buildApplicationDTOs(daily, feedbackHistory = []) {
  if (!daily) return {
    brief: null, recommendationPackages: [], timeline: [], weeklyPlan: null, opportunities: []
  }
  const primary = daily.members?.[0] || null
  const prefs   = computeFeedbackPrefs(feedbackHistory)
  const ranked  = rankRecommendations(buildDailyPackages(primary, null, daily.family_alignment), prefs)
  return {
    brief:                  adaptDailyBrief(buildMorningBrief(daily, primary), daily),
    recommendationPackages: adaptRecommendations(ranked, primary?.stars || daily?.stars),
    timeline:               adaptTimeline(primary?.timeline),
    weeklyPlan:             adaptWeeklyPlan(buildWeeklyPlan(daily.week_plan)),
    opportunities:          adaptOpportunities(buildUpcomingOpportunities(daily.week_plan))
  }
}

function computeFeedbackPrefs(feedbackHistory) {
  const prefs = {}
  for (const fb of feedbackHistory) {
    if (!fb.category) continue
    const p = prefs[fb.category] || { helpful:0, not_helpful:0, skipped:0 }
    if (fb.outcome === 'helpful')     p.helpful     += 1
    if (fb.outcome === 'not_helpful') p.not_helpful += 1
    if (fb.outcome === 'skipped')     p.skipped     += 1
    prefs[fb.category] = p
  }
  return prefs
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

/**
 * initialiseApp()
 *
 * Synchronous. Reads identity from storage before first render.
 * Returns the full initial state object consumed by useBootstrap.
 */
export function initialiseApp() {
  const identity = identityManager.load()
  identityManager.trackOpen()
  return {
    identity,
    users:         identityManager.allUsers,
    primaryUser:   identityManager.primaryUser,
    profileStatus: identityManager.profileStatus
  }
}

// ─── Dev diagnostics ──────────────────────────────────────────────────────────

export function buildDevDiagnostics(dtos) {
  if (typeof import.meta === 'undefined' || !import.meta.env?.DEV) return null
  return buildDiagnostics({
    brief:        dtos.brief,
    recommendations: dtos.recommendationPackages,
    weeklyPlan:   dtos.weeklyPlan,
    opportunities:dtos.opportunities,
    timeline:     dtos.timeline,
    familyBrief:  dtos.brief?.familyBrief
  })
}

// Re-export for hook convenience
export { identityManager }
