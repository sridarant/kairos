import { useState, useEffect, useMemo } from 'react'
import HomeScreen    from './components/HomeScreen'
import PlannerScreen from './components/PlannerScreen'
import ProfileModal  from './components/ProfileModal'
import InviteModal   from './components/InviteModal'
import InsightsModal from './components/InsightsModal'
import BottomNav     from './components/BottomNav'
import { getUserData, saveProfile, trackOpen, trackFeedback, computeAnalytics } from './lib/dataClient'
import { buildDailyPackages } from '../lib/recommendations/index.js'
import { rankRecommendations, splitRecommendations } from '../lib/recommendations/recommendationRanker.js'
import { validateAndLog }  from '../lib/recommendations/recommendationValidator.js'
import { buildWeeklyPlan, buildUpcomingOpportunities } from '../lib/recommendations/weeklyPlanner.js'

export default function App() {
  const [daily, setDaily]               = useState(null)
  const [loading, setLoading]           = useState(true)
  const [profileOpen, setProfileOpen]   = useState(false)
  const [inviteOpen, setInviteOpen]     = useState(false)
  const [insightsOpen, setInsightsOpen] = useState(false)
  const [plannerOpen, setPlannerOpen]   = useState(false)
  const [userData, setUserData]         = useState(null)
  const [userPrefs, setUserPrefs]       = useState({})  // derived from feedback analytics

  useEffect(() => {
    async function init() {
      trackOpen()
      const data = await getUserData()
      setUserData(data)
      // Compute user preferences from feedback history
      const prefs = computeFeedbackPrefs(data?.feedback || [])
      setUserPrefs(prefs)
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
      if (!res.ok) throw new Error()
      setDaily(await res.json())
    } catch {
      // No mock fallback in production — show empty state instead
      setDaily(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveUsers(updatedUsers) {
    await saveProfile(updatedUsers)
    const fresh = { ...userData, user_profile: updatedUsers }
    setUserData(fresh)
    const prefs = computeFeedbackPrefs(fresh.feedback || [])
    setUserPrefs(prefs)
    await fetchDaily(updatedUsers, computeAnalytics(fresh.history || []))
  }

  async function handleFeedback(category, action, outcome) {
    await trackFeedback(category, action, outcome)
    // Update local prefs optimistically
    setUserPrefs(prev => {
      const p = { ...(prev[category] || {}) }
      if (outcome === 'helpful')     p.helpful    = (p.helpful || 0) + 1
      if (outcome === 'not_helpful') p.not_helpful = (p.not_helpful || 0) + 1
      if (outcome === 'skipped')     p.skipped     = (p.skipped || 0) + 1
      return { ...prev, [category]: p }
    })
  }

  // Build ranked recommendation packages from daily response
  const recommendationPackages = useMemo(() => {
    if (!daily) return []
    const primaryMember = daily.members?.[0]
    if (!primaryMember) return []
    const rawPackages = buildDailyPackages(primaryMember, null, daily.family_alignment)
    const valid       = validateAndLog(rawPackages)
    const ranked      = rankRecommendations(valid, userPrefs)
    return ranked  // UI splits into top/rest itself
  }, [daily, userPrefs])

  // Build weekly plan and opportunities
  const weeklyPlan   = useMemo(() => buildWeeklyPlan(daily?.week_plan), [daily])
  const opportunities = useMemo(() => buildUpcomingOpportunities(daily?.week_plan), [daily])

  const users       = userData?.user_profile || []
  const primaryUser = users[0] || null
  const feedbackAdj = computeAnalytics(userData?.history || [])

  return (
    <div style={{ maxWidth:448, margin:'0 auto', minHeight:'100dvh', position:'relative', paddingBottom:72 }}>
      <HomeScreen
        daily={daily} loading={loading}
        primaryUser={primaryUser} userData={userData}
        onProfileOpen={() => setProfileOpen(true)}
        onInsights={() => setInsightsOpen(true)}
        onFamilyPlan={() => setPlannerOpen(true)}
        onFetchFuture={(days) => fetchDaily(users, feedbackAdj, days)}
        onFeedback={handleFeedback}
        recommendationPackages={recommendationPackages}
      />
      <BottomNav
        onHome={() => fetchDaily(users, feedbackAdj)}
        onPlanner={() => setPlannerOpen(true)}
        onInsights={() => setInsightsOpen(true)}
        onProfile={() => setProfileOpen(true)}
      />
      {profileOpen  && <ProfileModal onClose={() => setProfileOpen(false)} users={users} onSave={handleSaveUsers} />}
      {inviteOpen   && <InviteModal  onClose={() => setInviteOpen(false)} />}
      {insightsOpen && <InsightsModal onClose={() => setInsightsOpen(false)} userData={userData} />}
      {plannerOpen  && (
        <PlannerScreen
          weeklyPlan={weeklyPlan}
          opportunities={opportunities}
          daily={daily}
          onFetchFuture={(days) => { setPlannerOpen(false); fetchDaily(users, feedbackAdj, days) }}
          onClose={() => setPlannerOpen(false)}
        />
      )}
    </div>
  )
}

// Derive per-category preference weights from stored feedback
function computeFeedbackPrefs(feedbackArray) {
  const prefs = {}
  for (const fb of (feedbackArray || [])) {
    if (!fb.category) continue
    const p = prefs[fb.category] || { helpful:0, not_helpful:0, skipped:0 }
    if (fb.outcome === 'helpful')      p.helpful += 1
    if (fb.outcome === 'not_helpful')  p.not_helpful += 1
    if (fb.outcome === 'skipped')      p.skipped += 1
    prefs[fb.category] = p
  }
  return prefs
}
