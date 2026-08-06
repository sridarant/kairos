/**
 * /src/hooks/useBootstrap.js
 *
 * Single hook — all app state and actions.
 * Delegates entirely to BootstrapManager. No business logic here.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  initialiseApp, fetchDailyAPI, buildApplicationDTOs,
  buildDevDiagnostics, buildDateContext, computeFeedbackPrefs,
  saveProfile, trackFeedback, computeAnalytics
} from '../app/bootstrap/BootstrapManager.js'
import { ASYNC_STATE, TABS } from '../constants/index.js'
import { deriveProfileStatus } from '../app/config/userProfile.js'

export function useBootstrap() {
  const [daily,         setDaily]         = useState(null)
  const [status,        setStatus]        = useState(ASYNC_STATE.LOADING)
  const [daysAhead,     setDaysAhead]     = useState(0)
  const [tab,           setTab]           = useState(TABS.TODAY)
  const [userData,      setUserData]      = useState(null)
  const [userPrefs,     setUserPrefs]     = useState({})
  const [profileStatus, setProfileStatus] = useState('demo')
  // Modals
  const [profileOpen,   setProfileOpen]   = useState(false)
  const [inviteOpen,    setInviteOpen]    = useState(false)
  const [insightsOpen,  setInsightsOpen]  = useState(false)
  const [plannerOpen,   setPlannerOpen]   = useState(false)

  // ── Startup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        const init = await initialiseApp()
        if (cancelled) return
        setUserData(init.userData)
        setUserPrefs(init.userPrefs)
        setProfileStatus(init.profileStatus)
        await loadDailyInner(init.users, init.feedbackAdj, 0)
      } catch (err) {
        if (!cancelled) { console.error('[Bootstrap] init failed:', err.message); setStatus(ASYNC_STATE.ERROR) }
      }
    }
    boot()
    return () => { cancelled = true }
  }, [])

  // ── Internal load ─────────────────────────────────────────────────────────
  async function loadDailyInner(users, feedbackAdj, days) {
    setStatus(ASYNC_STATE.LOADING)
    try {
      const raw = await fetchDailyAPI(users, feedbackAdj, days)
      setDaily(raw)
      setDaysAhead(days)
      setStatus(ASYNC_STATE.SUCCESS)
    } catch (err) {
      console.error('[Bootstrap] fetchDaily failed:', err.message)
      setDaily(null)
      setStatus(ASYNC_STATE.ERROR)
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const users       = useMemo(() => Array.isArray(userData?.user_profile) ? userData.user_profile : [], [userData])
  const primaryUser = useMemo(() => users[0] || null, [users])
  const feedbackAdj = useMemo(() => computeAnalytics(userData?.history || []), [userData])
  const dateContext = useMemo(() => buildDateContext(daysAhead), [daysAhead])

  // ── DTOs ──────────────────────────────────────────────────────────────────
  const dtos        = useMemo(() => buildApplicationDTOs(daily, userPrefs), [daily, userPrefs])
  const diagnostics = useMemo(() => buildDevDiagnostics(dtos), [dtos])

  // ── Actions ───────────────────────────────────────────────────────────────
  const loadDaily = useCallback(async (days = 0) => {
    await loadDailyInner(users, feedbackAdj, days)
  }, [users, feedbackAdj])

  const handleSaveUsers = useCallback(async (updatedUsers) => {
    await saveProfile(updatedUsers)
    const fresh = { ...userData, user_profile: updatedUsers }
    setUserData(fresh)
    const prefs = computeFeedbackPrefs(fresh.feedback || [])
    setUserPrefs(prefs)
    setProfileStatus(deriveProfileStatus(updatedUsers))
    await loadDailyInner(updatedUsers, computeAnalytics(fresh.history || []), 0)
  }, [userData])

  const handleFeedback = useCallback(async (category, action, outcome) => {
    await trackFeedback(category, action, outcome)
    setUserPrefs(prev => {
      const p = { ...(prev[category] || {}) }
      if (outcome === 'helpful')     p.helpful     = (p.helpful || 0) + 1
      if (outcome === 'not_helpful') p.not_helpful = (p.not_helpful || 0) + 1
      if (outcome === 'skipped')     p.skipped     = (p.skipped || 0) + 1
      return { ...prev, [category]: p }
    })
  }, [])

  const handleTabChange = useCallback((t) => {
    setTab(t)
    if (t === TABS.PLANNER) setPlannerOpen(true)
    if (t === TABS.JOURNAL) setInsightsOpen(true)
    if (t === TABS.FAMILY)  setPlannerOpen(true)
    if (t === TABS.TODAY)   { setPlannerOpen(false); setInsightsOpen(false) }
  }, [])

  const handleFetchFuture = useCallback((days) => loadDaily(days), [loadDaily])
  const handleReturnToday  = useCallback(() => loadDaily(0),    [loadDaily])

  return {
    // Core state
    daily, status, tab, daysAhead, dateContext,
    userData, primaryUser, users, feedbackAdj, profileStatus,
    // DTOs
    ...dtos, diagnostics,
    // Modals
    profileOpen, inviteOpen, insightsOpen, plannerOpen,
    // Actions
    handleSaveUsers, handleFeedback, handleTabChange,
    handleFetchFuture, handleReturnToday, loadDaily,
    // Modal toggles
    openProfile:   () => setProfileOpen(true),
    closeProfile:  () => setProfileOpen(false),
    openInvite:    () => setInviteOpen(true),
    closeInvite:   () => setInviteOpen(false),
    openInsights:  () => setInsightsOpen(true),
    closeInsights: () => { setInsightsOpen(false); setTab(TABS.TODAY) },
    openPlanner:   () => setPlannerOpen(true),
    closePlanner:  () => { setPlannerOpen(false); setTab(TABS.TODAY) }
  }
}
