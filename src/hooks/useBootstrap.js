/**
 * /src/hooks/useBootstrap.js
 *
 * Single hook — all app state and actions.
 * Delegates to BootstrapManager and IdentityManager.
 * No business logic here.
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  initialiseApp, fetchDailyAPI, buildApplicationDTOs,
  buildDevDiagnostics, buildDateContext, computeFeedbackPrefs,
  identityManager
} from '../app/bootstrap/BootstrapManager.js'
import { deriveProfileStatus } from '../app/config/userProfile.js'
import { ASYNC_STATE, TABS } from '../constants/index.js'

export function useBootstrap() {
  const [daily,         setDaily]         = useState(null)
  const [status,        setStatus]        = useState(ASYNC_STATE.LOADING)
  const [daysAhead,     setDaysAhead]     = useState(0)
  const [tab,           setTab]           = useState(TABS.TODAY)
  // Identity state — sourced from IdentityManager
  const [identity,      setIdentity]      = useState(null)
  const [profileStatus, setProfileStatus] = useState('demo')
  // Modals
  const [profileOpen,    setProfileOpen]   = useState(false)
  const [inviteOpen,     setInviteOpen]    = useState(false)
  const [insightsOpen,   setInsightsOpen]  = useState(false)
  const [plannerOpen,    setPlannerOpen]   = useState(false)
  const [onboardOpen,    setOnboardOpen]   = useState(false)
  const [saveMessage,    setSaveMessage]   = useState(null)

  // Track users ref to avoid stale closure in loadDailyInner
  const usersRef = useRef([])

  // ── Subscribe to IdentityManager changes ──────────────────────────────────
  useEffect(() => {
    const unsub = identityManager.subscribe((newIdentity) => {
      setIdentity(newIdentity)
      setProfileStatus(identityManager.profileStatus)
      usersRef.current = identityManager.userProfileArray
    })
    return unsub
  }, [])

  // ── Startup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        // Synchronous identity load — no network needed
        const init = initialiseApp()
        if (cancelled) return
        setIdentity(init.identity)
        setProfileStatus(init.profileStatus)
        usersRef.current = init.users
        // If no profile, show onboarding
        if (!identityManager.isOnboarded) {
          setOnboardOpen(true)
        }
        // Then fetch recommendations with whatever profile we have
        await loadDailyInner(init.users, {}, 0)
      } catch (err) {
        if (!cancelled) { console.error('[Bootstrap] init failed:', err.message); setStatus(ASYNC_STATE.ERROR) }
      }
    }
    boot()
    return () => { cancelled = true }
  }, [])

  // ── Fetch daily ───────────────────────────────────────────────────────────
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
  const users       = useMemo(() => identity ? identityManager.userProfileArray : [], [identity])
  const primaryUser = useMemo(() => users[0] || null, [users])
  const userPrefs   = useMemo(() => computeFeedbackPrefs(identity?.appState?.feedbackHistory || []), [identity])
  const dateContext = useMemo(() => buildDateContext(daysAhead), [daysAhead])
  const dtos        = useMemo(() => buildApplicationDTOs(daily, userPrefs), [daily, userPrefs])
  const diagnostics = useMemo(() => buildDevDiagnostics(dtos), [dtos])

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleSaveUsers = useCallback(async (updatedUsers) => {
    identityManager.saveUsersArray(updatedUsers)
    setSaveMessage('Profile saved — recommendations updated.')
    setTimeout(() => setSaveMessage(null), 3000)
    // Reload recommendations with new identity — synchronous state now updated
    await loadDailyInner(updatedUsers, {}, 0)
  }, [])

  const handleFeedback = useCallback((category, action, outcome) => {
    identityManager.addFeedback(category, action, outcome)
  }, [])

  const handleExportProfile = useCallback(() => {
    try {
      const json = identityManager.exportJSON()
      const blob = new Blob([json], { type:'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = 'kairos-profile.json'; a.click()
      URL.revokeObjectURL(url)
    } catch(e) { console.error('Export failed:', e.message) }
  }, [])

  const handleImportProfile = useCallback(async (json) => {
    const result = identityManager.importJSON(json)
    if (!result.ok) return { ok:false, error: result.error }
    setSaveMessage('Profile imported — recommendations updated.')
    setTimeout(() => setSaveMessage(null), 3000)
    await loadDailyInner(identityManager.userProfileArray, {}, 0)
    return { ok: true }
  }, [])

  const handleDeleteProfile = useCallback(async () => {
    identityManager.deleteIdentity()
    setOnboardOpen(true)
    await loadDailyInner([], {}, 0)
  }, [])

  const handleTabChange = useCallback((t) => {
    setTab(t)
    if (t === TABS.PLANNER) setPlannerOpen(true)
    if (t === TABS.JOURNAL) setInsightsOpen(true)
    if (t === TABS.FAMILY)  setPlannerOpen(true)
    if (t === TABS.TODAY)   { setPlannerOpen(false); setInsightsOpen(false) }
  }, [])

  const handleFetchFuture  = useCallback((days) => loadDailyInner(usersRef.current, {}, days), [])
  const handleReturnToday  = useCallback(() => loadDailyInner(usersRef.current, {}, 0), [])

  const handleOnboardComplete = useCallback(async (usersArray) => {
    identityManager.saveUsersArray(usersArray)
    setOnboardOpen(false)
    setSaveMessage('Welcome to Kairos — loading your personalised guidance.')
    setTimeout(() => setSaveMessage(null), 4000)
    await loadDailyInner(usersArray, {}, 0)
  }, [])

  return {
    // State
    daily, status, tab, daysAhead, dateContext,
    identity, primaryUser, users, profileStatus,
    saveMessage,
    // DTOs
    ...dtos, diagnostics,
    // Modals
    profileOpen, inviteOpen, insightsOpen, plannerOpen, onboardOpen,
    // Actions
    handleSaveUsers, handleFeedback, handleTabChange,
    handleFetchFuture, handleReturnToday,
    handleExportProfile, handleImportProfile, handleDeleteProfile,
    handleOnboardComplete,
    // Modal toggles
    openProfile:   () => setProfileOpen(true),
    closeProfile:  () => setProfileOpen(false),
    openInvite:    () => setInviteOpen(true),
    closeInvite:   () => setInviteOpen(false),
    openInsights:  () => setInsightsOpen(true),
    closeInsights: () => { setInsightsOpen(false); setTab(TABS.TODAY) },
    openPlanner:   () => setPlannerOpen(true),
    closePlanner:  () => { setPlannerOpen(false); setTab(TABS.TODAY) },
    closeOnboard:  () => setOnboardOpen(false),
  }
}
