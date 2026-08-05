/**
 * App.jsx v28.0
 *
 * Single responsibility: data orchestration.
 * All engine outputs pass through the adapter layer before reaching UI.
 * No raw engine objects or snake_case properties reach React components.
 */

import { useState, useEffect, useMemo } from 'react'
import HomeScreen    from './components/HomeScreen'
import PlannerScreen from './components/PlannerScreen'
import ProfileModal  from './components/ProfileModal'
import InviteModal   from './components/InviteModal'
import InsightsModal from './components/InsightsModal'
import BottomNav     from './components/BottomNav'
import { getUserData, saveProfile, trackOpen, trackFeedback, computeAnalytics } from './lib/dataClient'
import { buildDailyPackages }                                from '../lib/recommendations/index.js'
import { rankRecommendations }                               from '../lib/recommendations/recommendationRanker.js'
import { buildWeeklyPlan, buildUpcomingOpportunities }      from '../lib/recommendations/weeklyPlanner.js'
import { buildMorningBrief }                                 from '../lib/dailyBrief/index.js'
// ─── Adapter layer: raw engine → validated DTOs ───────────────────────────────
import {
  adaptRecommendations,
  adaptDailyBrief,
  adaptTimeline,
  adaptWeeklyPlan,
  adaptOpportunities,
  buildDiagnostics
} from '../lib/adapters/index.js'

export default function App() {
  const [daily, setDaily]               = useState(null)
  const [loading, setLoading]           = useState(true)
  const [tab, setTab]                   = useState('today')
  const [profileOpen, setProfileOpen]   = useState(false)
  const [inviteOpen, setInviteOpen]     = useState(false)
  const [insightsOpen, setInsightsOpen] = useState(false)
  const [plannerOpen, setPlannerOpen]   = useState(false)
  const [userData, setUserData]         = useState(null)
  const [userPrefs, setUserPrefs]       = useState({})

  useEffect(() => {
    async function init() {
      trackOpen()
      const data = await getUserData()
      setUserData(data)
      setUserPrefs(computeFeedbackPrefs(data?.feedback || []))
      await fetchDaily(data?.user_profile || [], computeAnalytics(data?.history || []))
    }
    init()
  }, [])

  async function fetchDaily(users, feedbackAdj, daysAhead = 0) {
    setLoading(true)
    try {
      const res = await fetch('/api/daily', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ users: users || [], feedbackAdj, daysAhead })
      })
      if (!res.ok) throw new Error(`/api/daily returned ${res.status}`)
      setDaily(await res.json())
    } catch (err) {
      console.error('[App] fetchDaily failed:', err.message)
      setDaily(null)
    } finally { setLoading(false) }
  }

  async function handleSaveUsers(updatedUsers) {
    await saveProfile(updatedUsers)
    const fresh = { ...userData, user_profile: updatedUsers }
    setUserData(fresh)
    await fetchDaily(updatedUsers, computeAnalytics(fresh.history || []))
  }

  async function handleFeedback(category, action, outcome) {
    await trackFeedback(category, action, outcome)
    setUserPrefs(prev => {
      const p = { ...(prev[category] || {}) }
      if (outcome === 'helpful')     p.helpful     = (p.helpful || 0) + 1
      if (outcome === 'not_helpful') p.not_helpful = (p.not_helpful || 0) + 1
      if (outcome === 'skipped')     p.skipped     = (p.skipped || 0) + 1
      return { ...prev, [category]: p }
    })
  }

  // ─── All transformations happen here, BEFORE reaching any component ──────────

  // 1. Raw recommendation packages → adapted + validated DTOs
  const recommendationPackages = useMemo(() => {
    if (!daily) return []
    const primary = daily.members?.[0]
    if (!primary) return []
    const raw    = buildDailyPackages(primary, null, daily.family_alignment)
    const ranked = rankRecommendations(raw, userPrefs)
    return adaptRecommendations(ranked)   // ← adapter normalises all fields
  }, [daily, userPrefs])

  // 2. Timeline → adapted DTOs
  const timeline = useMemo(() => {
    const rawTimeline = daily?.members?.[0]?.timeline
    return adaptTimeline(rawTimeline)     // ← adapter ensures startTime, description, etc.
  }, [daily])

  // 3. Daily brief → adapted DTO
  const brief = useMemo(() => {
    if (!daily) return null
    const rawBrief = buildMorningBrief(daily, daily.members?.[0] || null)
    return adaptDailyBrief(rawBrief, daily)   // ← adapter merges, normalises, validates
  }, [daily])

  // 4. Weekly plan → adapted DTO
  const weeklyPlan = useMemo(() => {
    const raw = buildWeeklyPlan(daily?.week_plan)
    return adaptWeeklyPlan(raw)           // ← adapter ensures daysAhead, confidenceLabel, etc.
  }, [daily])

  // 5. Upcoming opportunities → adapted DTOs
  const opportunities = useMemo(() => {
    const raw = buildUpcomingOpportunities(daily?.week_plan)
    return adaptOpportunities(raw)        // ← adapter normalises all fields
  }, [daily])

  // 6. Dev diagnostics (never in production)
  const diagnostics = useMemo(() => {
    if (!import.meta.env.DEV) return null
    return buildDiagnostics({
      brief,
      recommendations: recommendationPackages,
      weeklyPlan,
      opportunities,
      timeline,
      familyBrief: brief?.familyBrief
    })
  }, [brief, recommendationPackages, weeklyPlan, opportunities, timeline])

  const users       = userData?.user_profile || []
  const primaryUser = users[0] || null
  const feedbackAdj = computeAnalytics(userData?.history || [])

  function handleTabChange(t) {
    setTab(t)
    if (t === 'planner') setPlannerOpen(true)
    if (t === 'journal') setInsightsOpen(true)
    if (t === 'family')  setPlannerOpen(true)
    if (t === 'today')   { setPlannerOpen(false); setInsightsOpen(false) }
  }

  return (
    <div style={{ maxWidth:448, margin:'0 auto', minHeight:'100dvh', position:'relative', paddingBottom:76 }}>
      <HomeScreen
        // All props are validated DTOs — no raw engine objects
        brief={brief}
        recommendationPackages={recommendationPackages}
        timeline={timeline}
        weeklyPlan={weeklyPlan}
        opportunities={opportunities}
        diagnostics={diagnostics}
        // Meta
        daily={daily}
        loading={loading}
        primaryUser={primaryUser}
        userData={userData}
        // Callbacks
        onProfileOpen={() => setProfileOpen(true)}
        onInvite={() => setInviteOpen(true)}
        onFamilyPlan={() => { setPlannerOpen(true); setTab('family') }}
        onFetchFuture={(days) => fetchDaily(users, feedbackAdj, days)}
        onFeedback={handleFeedback}
      />

      <BottomNav
        active={tab}
        onToday={() => handleTabChange('today')}
        onPlanner={() => handleTabChange('planner')}
        onFamily={() => handleTabChange('family')}
        onJournal={() => handleTabChange('journal')}
        onMore={() => setProfileOpen(true)}
      />

      {profileOpen  && <ProfileModal  onClose={() => setProfileOpen(false)}  users={users} onSave={handleSaveUsers} />}
      {inviteOpen   && <InviteModal   onClose={() => setInviteOpen(false)} />}
      {insightsOpen && <InsightsModal onClose={() => { setInsightsOpen(false); setTab('today') }} userData={userData} />}
      {plannerOpen  && (
        <PlannerScreen
          weeklyPlan={weeklyPlan}
          opportunities={opportunities}
          daily={daily}
          onFetchFuture={(days) => { setPlannerOpen(false); setTab('today'); fetchDaily(users, feedbackAdj, days) }}
          onClose={() => { setPlannerOpen(false); setTab('today') }}
        />
      )}
    </div>
  )
}

function computeFeedbackPrefs(feedbackArray) {
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
