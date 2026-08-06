/**
 * /src/app/bootstrap/BootstrapManager.js
 *
 * Owns application startup, API orchestration, loading lifecycle, and DTO creation.
 * Returns a single ApplicationState to React via useBootstrap().
 *
 * Nothing in this file depends on React.
 */

import { getUserData, saveProfile, trackOpen, trackFeedback, computeAnalytics } from '../../lib/dataClient.js'
import { buildDailyPackages }                                from '../../../lib/recommendations/index.js'
import { rankRecommendations }                               from '../../../lib/recommendations/recommendationRanker.js'
import { buildWeeklyPlan, buildUpcomingOpportunities }      from '../../../lib/recommendations/weeklyPlanner.js'
import { buildMorningBrief }                                 from '../../../lib/dailyBrief/index.js'
import {
  adaptRecommendations, adaptDailyBrief, adaptTimeline,
  adaptWeeklyPlan, adaptOpportunities, buildDiagnostics
} from '../../../lib/adapters/index.js'
import { deriveProfileStatus, PROFILE_STATUS } from '../config/userProfile.js'
import { ASYNC_STATE } from '../../constants/index.js'

// ─── User preferences ─────────────────────────────────────────────────────────
export function computeFeedbackPrefs(feedbackArray) {
  const prefs = {}
  for (const fb of (feedbackArray || [])) {
    if (!fb.category) continue
    const p = prefs[fb.category] || { helpful:0, not_helpful:0, skipped:0 }
    if (fb.outcome === 'helpful')     p.helpful     += 1
    if (fb.outcome === 'not_helpful') p.not_helpful += 1
    if (fb.outcome === 'skipped')     p.skipped     += 1
    prefs[fb.category] = p
  }
  return prefs
}

// ─── Date context ─────────────────────────────────────────────────────────────
/**
 * buildDateContext(daysAhead) → DateContext
 * Every screen that displays data receives this so users always know what date they're viewing.
 */
export function buildDateContext(daysAhead = 0) {
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  const target = new Date(base)
  target.setDate(target.getDate() + daysAhead)

  const fmt = (d, opts) => d.toLocaleDateString('en-US', opts)
  const today = new Date(base)

  const isToday    = daysAhead === 0
  const isTomorrow = daysAhead === 1
  const isPast     = daysAhead < 0

  const relativeLabel = isToday    ? 'Today'
    : isTomorrow ? 'Tomorrow'
    : daysAhead === -1 ? 'Yesterday'
    : daysAhead > 0    ? `In ${daysAhead} days`
    : `${Math.abs(daysAhead)} days ago`

  return {
    date:          target.toISOString().slice(0, 10),
    daysAhead,
    isToday,
    isTomorrow,
    isPast,
    relativeLabel,
    weekday:       fmt(target, { weekday: 'long' }),
    shortWeekday:  fmt(target, { weekday: 'short' }),
    dayMonth:      fmt(target, { day: 'numeric', month: 'long' }),
    fullDate:      fmt(target, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    shortDate:     fmt(target, { day: 'numeric', month: 'short' }),
    iso:           target.toISOString().slice(0, 10),
    // Week context
    weekLabel:     `Week of ${fmt(base, { day:'numeric', month:'short' })}–${fmt(new Date(base.getTime()+6*86400000), { day:'numeric', month:'short', year:'numeric' })}`,
    monthLabel:    fmt(target, { month: 'long', year: 'numeric' })
  }
}

// ─── API ──────────────────────────────────────────────────────────────────────
export async function fetchDailyAPI(users, feedbackAdj, daysAhead = 0) {
  const res = await fetch('/api/daily', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ users: users || [], feedbackAdj, daysAhead })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// ─── DTO pipeline ─────────────────────────────────────────────────────────────
export function buildApplicationDTOs(daily, userPrefs = {}) {
  if (!daily) return {
    brief: null, recommendationPackages: [], timeline: [],
    weeklyPlan: null, opportunities: []
  }
  const primary     = daily.members?.[0] || null
  const rawPackages = buildDailyPackages(primary, null, daily.family_alignment)
  const ranked      = rankRecommendations(rawPackages, userPrefs)
  const rawBrief    = buildMorningBrief(daily, primary)
  const rawWeekly   = buildWeeklyPlan(daily.week_plan)
  const rawOpp      = buildUpcomingOpportunities(daily.week_plan)
  return {
    brief:                  adaptDailyBrief(rawBrief, daily),
    recommendationPackages: adaptRecommendations(ranked),
    timeline:               adaptTimeline(primary?.timeline),
    weeklyPlan:             adaptWeeklyPlan(rawWeekly),
    opportunities:          adaptOpportunities(rawOpp)
  }
}

// ─── Startup ──────────────────────────────────────────────────────────────────
export async function initialiseApp() {
  trackOpen()
  const userData    = await getUserData()
  const userPrefs   = computeFeedbackPrefs(userData?.feedback || [])
  const users       = Array.isArray(userData?.user_profile) ? userData.user_profile : []
  const primaryUser = users[0] || null
  const feedbackAdj = computeAnalytics(userData?.history || [])
  const profileStatus = deriveProfileStatus(users)
  return { userData, userPrefs, users, primaryUser, feedbackAdj, profileStatus }
}

// ─── Dev diagnostics ──────────────────────────────────────────────────────────
export function buildDevDiagnostics(dtos) {
  if (typeof import.meta === 'undefined' || !import.meta.env?.DEV) return null
  return buildDiagnostics({
    brief: dtos.brief, recommendations: dtos.recommendationPackages,
    weeklyPlan: dtos.weeklyPlan, opportunities: dtos.opportunities,
    timeline: dtos.timeline, familyBrief: dtos.brief?.familyBrief
  })
}

export { saveProfile, trackFeedback, computeAnalytics }
