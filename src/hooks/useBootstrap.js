/**
 * /src/hooks/useBootstrap.js
 *
 * The single hook React uses to interact with the Bootstrap Manager.
 * Exposes all application state and actions to components.
 * No business logic here — delegates entirely to BootstrapManager.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  initialiseApp, fetchDailyAPI, buildApplicationDTOs,
  buildDevDiagnostics, computeFeedbackPrefs,
  saveProfile, trackFeedback, computeAnalytics
} from '../app/bootstrap/BootstrapManager.js'
import { ASYNC_STATE, TABS } from '../constants/index.js'

export function useBootstrap() {
  const [daily,      setDaily]      = useState(null)
  const [status,     setStatus]     = useState(ASYNC_STATE.LOADING)
  const [tab,        setTab]        = useState(TABS.TODAY)
  const [userData,   setUserData]   = useState(null)
  const [userPrefs,  setUserPrefs]  = useState({})
  // Modal visibility
  const [profileOpen,  setProfileOpen]  = useState(false)
  const [inviteOpen,   setInviteOpen]   = useState(false)
  const [insightsOpen, setInsightsOpen] = useState(false)
  const [plannerOpen,  setPlannerOpen]  = useState(false)

  // ── Startup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        const { userData: ud, userPrefs: up, users, feedbackAdj } = await initialiseApp()
        if (cancelled) return
        setUserData(ud)
        setUserPrefs(up)
        await loadDaily(users, feedbackAdj)
      } catch (err) {
        if (!cancelled) { console.error('[Bootstrap] init failed:', err.message); setStatus(ASYNC_STATE.ERROR) }
      }
    }
    boot()
    return () => { cancelled = true }
  }, [])

  // ── Fetch daily data ───────────────────────────────────────────────────────
  const loadDaily = useCallback(async (users, feedbackAdj, daysAhead = 0) => {
    setStatus(ASYNC_STATE.LOADING)
    try {
      const raw = await fetchDailyAPI(users, feedbackAdj, daysAhead)
      setDaily(raw)
      setStatus(ASYNC_STATE.SUCCESS)
    } catch (err) {
      console.error('[Bootstrap] fetchDaily failed:', err.message)
      setDaily(null)
      setStatus(ASYNC_STATE.ERROR)
    }
  }, [])

  // ── Derived values ─────────────────────────────────────────────────────────
  const users       = userData?.user_profile || []
  const primaryUser = users[0] || null
  const feedbackAdj = computeAnalytics(userData?.history || [])

  // ── DTOs: computed once per daily change ───────────────────────────────────
  const dtos = useMemo(() => buildApplicationDTOs(daily, userPrefs), [daily, userPrefs])
  const diagnostics = useMemo(() => buildDevDiagnostics(dtos), [dtos])

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleSaveUsers = useCallback(async (updatedUsers) => {
    await saveProfile(updatedUsers)
    const fresh = { ...userData, user_profile: updatedUsers }
    setUserData(fresh)
    const prefs = computeFeedbackPrefs(fresh.feedback || [])
    setUserPrefs(prefs)
    await loadDaily(updatedUsers, computeAnalytics(fresh.history || []))
  }, [userData, loadDaily])

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

  const handleFetchFuture = useCallback((days) => {
    loadDaily(users, feedbackAdj, days)
  }, [users, feedbackAdj, loadDaily])

  return {
    // State
    daily, status, tab, userData, primaryUser, users, feedbackAdj,
    // DTOs (all validated, all camelCase)
    ...dtos,
    diagnostics,
    // Modal state
    profileOpen, inviteOpen, insightsOpen, plannerOpen,
    // Actions
    handleSaveUsers, handleFeedback, handleTabChange, handleFetchFuture,
    // Modal toggles
    openProfile:  () => setProfileOpen(true),
    closeProfile: () => setProfileOpen(false),
    openInvite:   () => setInviteOpen(true),
    closeInvite:  () => setInviteOpen(false),
    openInsights: () => setInsightsOpen(true),
    closeInsights:() => { setInsightsOpen(false); setTab(TABS.TODAY) },
    openPlanner:  () => setPlannerOpen(true),
    closePlanner: () => { setPlannerOpen(false); setTab(TABS.TODAY) }
  }
}
