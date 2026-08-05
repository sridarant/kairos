/**
 * /src/app/bootstrap/BootstrapManager.js
 *
 * Owns application startup, API orchestration, loading lifecycle, and
 * DTO creation. Returns a single ApplicationState object to React.
 *
 * Responsibilities:
 *   - Load user data from Supabase/cache
 *   - Fetch /api/daily and handle errors
 *   - Run all adapters and produce validated DTOs
 *   - Expose one state object to App.jsx
 *
 * React components must NEVER import from this module directly.
 * They consume state via the useBootstrap() hook.
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
import { ASYNC_STATE } from '../../constants/index.js'

// ─── User preference derivation ───────────────────────────────────────────────
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

// ─── API fetch ────────────────────────────────────────────────────────────────
export async function fetchDailyAPI(users, feedbackAdj, daysAhead = 0) {
  const res = await fetch('/api/daily', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ users: users || [], feedbackAdj, daysAhead })
  })
  if (!res.ok) throw new Error(`/api/daily returned ${res.status}`)
  return res.json()
}

// ─── DTO pipeline ─────────────────────────────────────────────────────────────
/**
 * buildApplicationDTOs(daily, userPrefs)
 *
 * Runs the full adapter pipeline on a raw /api/daily response.
 * Returns all validated DTOs consumed by the UI.
 */
export function buildApplicationDTOs(daily, userPrefs = {}) {
  if (!daily) {
    return {
      brief:                  null,
      recommendationPackages: [],
      timeline:               [],
      weeklyPlan:             null,
      opportunities:          []
    }
  }

  const primary = daily.members?.[0] || null

  const rawPackages = buildDailyPackages(primary, null, daily.family_alignment)
  const ranked      = rankRecommendations(rawPackages, userPrefs)

  const rawBrief    = buildMorningBrief(daily, primary)
  const rawWeekly   = buildWeeklyPlan(daily.week_plan)
  const rawOpp      = buildUpcomingOpportunities(daily.week_plan)
  const rawTimeline = primary?.timeline

  return {
    brief:                  adaptDailyBrief(rawBrief, daily),
    recommendationPackages: adaptRecommendations(ranked),
    timeline:               adaptTimeline(rawTimeline),
    weeklyPlan:             adaptWeeklyPlan(rawWeekly),
    opportunities:          adaptOpportunities(rawOpp)
  }
}

// ─── Bootstrap initialiser (called once on app start) ─────────────────────────
/**
 * initialiseApp()
 * Loads user data and returns initial application state.
 * @returns { userData, userPrefs, users, primaryUser, feedbackAdj }
 */
export async function initialiseApp() {
  trackOpen()
  const userData    = await getUserData()
  const userPrefs   = computeFeedbackPrefs(userData?.feedback || [])
  const users       = userData?.user_profile || []
  const primaryUser = users[0] || null
  const feedbackAdj = computeAnalytics(userData?.history || [])
  return { userData, userPrefs, users, primaryUser, feedbackAdj }
}

// ─── Dev diagnostics ──────────────────────────────────────────────────────────
export function buildDevDiagnostics(dtos) {
  if (typeof import.meta === 'undefined' || !import.meta.env?.DEV) return null
  return buildDiagnostics({
    brief:           dtos.brief,
    recommendations: dtos.recommendationPackages,
    weeklyPlan:      dtos.weeklyPlan,
    opportunities:   dtos.opportunities,
    timeline:        dtos.timeline,
    familyBrief:     dtos.brief?.familyBrief
  })
}

export { saveProfile, trackFeedback, computeAnalytics }
