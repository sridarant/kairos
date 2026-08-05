import { useState, useEffect, useMemo } from 'react'
import HomeScreen    from './components/HomeScreen'
import PlannerScreen from './components/PlannerScreen'
import ProfileModal  from './components/ProfileModal'
import InviteModal   from './components/InviteModal'
import InsightsModal from './components/InsightsModal'
import BottomNav     from './components/BottomNav'
import { getUserData, saveProfile, trackOpen, trackFeedback, computeAnalytics } from './lib/dataClient'
import { buildDailyPackages }            from '../lib/recommendations/index.js'
import { rankRecommendations }           from '../lib/recommendations/recommendationRanker.js'
import { validateAndLog }                from '../lib/recommendations/recommendationValidator.js'
import { buildWeeklyPlan, buildUpcomingOpportunities } from '../lib/recommendations/weeklyPlanner.js'

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
      if (!res.ok) throw new Error()
      setDaily(await res.json())
    } catch { setDaily(null) }
    finally { setLoading(false) }
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

  // All package-building stays in App — HomeScreen receives clean, ranked data
  const recommendationPackages = useMemo(() => {
    if (!daily) return []
    const primary = daily.members?.[0]
    if (!primary) return []
    const raw    = buildDailyPackages(primary, null, daily.family_alignment)
    const valid  = validateAndLog(raw)
    return rankRecommendations(valid, userPrefs)
  }, [daily, userPrefs])

  const weeklyPlan    = useMemo(() => buildWeeklyPlan(daily?.week_plan),             [daily])
  const opportunities = useMemo(() => buildUpcomingOpportunities(daily?.week_plan),  [daily])

  const users       = userData?.user_profile || []
  const primaryUser = users[0] || null
  const feedbackAdj = computeAnalytics(userData?.history || [])

  function handleTabChange(t) {
    setTab(t)
    if (t === 'planner') setPlannerOpen(true)
    if (t === 'journal') setInsightsOpen(true)
    if (t === 'family')  setPlannerOpen(true)   // Family uses Planner modal for now
    if (t === 'today')   setPlannerOpen(false)
  }

  return (
    <div style={{ maxWidth:448, margin:'0 auto', minHeight:'100dvh', position:'relative', paddingBottom:76 }}>
      <HomeScreen
        daily={daily}
        loading={loading}
        primaryUser={primaryUser}
        userData={userData}
        onProfileOpen={() => setProfileOpen(true)}
        onInvite={() => setInviteOpen(true)}
        onFamilyPlan={() => { setPlannerOpen(true); setTab('family') }}
        onFetchFuture={(days) => fetchDaily(users, feedbackAdj, days)}
        onFeedback={handleFeedback}
        recommendationPackages={recommendationPackages}
      />

      <BottomNav
        active={tab}
        onToday={() => { setTab('today'); setPlannerOpen(false); setInsightsOpen(false) }}
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
