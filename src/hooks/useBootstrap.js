/**
 * /src/hooks/useBootstrap.js
 *
 * Single hook for all application state and actions.
 * Delegates to IdentityManager and BootstrapManager.
 * No business logic here.
 *
 * WS6: Bootstrap sequence:
 *   1. initialiseApp() runs synchronously at module scope (before first render)
 *   2. First render receives correct profileStatus — no Demo flash
 *   3. fetchDailyAPI() runs asynchronously after mount
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  initialiseApp, fetchDailyAPI, buildApplicationDTOs,
  buildDevDiagnostics, buildDateContext, identityManager
} from '../app/bootstrap/BootstrapManager.js'
import { ASYNC_STATE, TABS } from '../constants/index.js'

// ─── Run synchronously at module import — before any React render ─────────────
const _init = initialiseApp()

export function useBootstrap() {
  const [daily,         setDaily]         = useState(null)
  const [status,        setStatus]        = useState(ASYNC_STATE.LOADING)
  const [daysAhead,     setDaysAhead]     = useState(0)
  const [tab,           setTab]           = useState(TABS.TODAY)

  // Identity state — seeded from synchronous _init, then kept in sync via subscription
  const [identity,      setIdentity]      = useState(_init.identity)
  const [profileStatus, setProfileStatus] = useState(_init.profileStatus)

  // Show onboarding only if not already onboarded
  const [onboardOpen,   setOnboardOpen]   = useState(!identityManager.isOnboarded)
  const [profileOpen,   setProfileOpen]   = useState(false)
  const [inviteOpen,    setInviteOpen]    = useState(false)
  const [insightsOpen,  setInsightsOpen]  = useState(false)
  const [plannerOpen,   setPlannerOpen]   = useState(false)
  const [saveMessage,   setSaveMessage]   = useState(null)

  // Stable ref so async callbacks always have current users without stale closure
  const usersRef = useRef(_init.users)

  // ── Subscribe to identity changes ─────────────────────────────────────────
  useEffect(() => {
    return identityManager.subscribe((newIdentity) => {
      setIdentity(newIdentity)
      setProfileStatus(identityManager.profileStatus)
      usersRef.current = identityManager.allUsers
    })
  }, [])

  // ── Fetch recommendations on mount ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    fetchDailyInner(_init.users, 0, () => cancelled)
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Internal fetch ────────────────────────────────────────────────────────
  async function fetchDailyInner(users, days, isCancelled) {
    setStatus(ASYNC_STATE.LOADING)
    try {
      const raw = await fetchDailyAPI(users, days)
      if (isCancelled?.()) return
      setDaily(raw)
      setDaysAhead(days)
      setStatus(ASYNC_STATE.SUCCESS)
    } catch (err) {
      if (isCancelled?.()) return
      console.error('[Bootstrap] fetch failed:', err.message)
      setDaily(null)
      setStatus(ASYNC_STATE.ERROR)
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const primaryUser = useMemo(() => identityManager.primaryUser,  [identity])
  const allUsers    = useMemo(() => identityManager.allUsers,     [identity])
  const feedbackHist= useMemo(() => identity?.appState?.feedbackHistory || [], [identity])
  const dateContext = useMemo(() => buildDateContext(daysAhead),   [daysAhead])
  const dtos        = useMemo(() => buildApplicationDTOs(daily, feedbackHist), [daily, feedbackHist])
  const diagnostics = useMemo(() => buildDevDiagnostics(dtos),    [dtos])

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Called by ProfileModal and OnboardingModal after user fills in their details. */
  const handleSaveProfile = useCallback(async (profileFields, familyArray = []) => {
    identityManager.saveProfile(profileFields, familyArray)
    setSaveMessage('Profile saved — guidance updated.')
    setTimeout(() => setSaveMessage(null), 3000)
    await fetchDailyInner(identityManager.allUsers, 0)
  }, [])

  /** Called by OnboardingModal on completion. */
  const handleOnboardComplete = useCallback(async (profileFields, familyArray = []) => {
    identityManager.saveProfile(profileFields, familyArray)
    setOnboardOpen(false)
    setSaveMessage('Welcome to Kairos.')
    setTimeout(() => setSaveMessage(null), 4000)
    await fetchDailyInner(identityManager.allUsers, 0)
  }, [])

  const handleFeedback = useCallback((category, action, outcome) => {
    identityManager.addFeedback(category, action, outcome)
  }, [])

  const handleExport = useCallback(() => {
    try {
      const json = identityManager.export()
      const url  = URL.createObjectURL(new Blob([json], { type:'application/json' }))
      Object.assign(document.createElement('a'), { href:url, download:'kairos-identity.json' }).click()
      URL.revokeObjectURL(url)
    } catch(e) { console.error('Export failed:', e.message) }
  }, [])

  const handleImport = useCallback(async (json) => {
    const result = identityManager.import(json)
    if (!result.ok) return result
    setSaveMessage('Profile imported.')
    setTimeout(() => setSaveMessage(null), 3000)
    await fetchDailyInner(identityManager.allUsers, 0)
    return result
  }, [])

  const handleDeleteProfile = useCallback(async () => {
    identityManager.clear()
    setOnboardOpen(true)
    await fetchDailyInner([], 0)
  }, [])

  const handleTabChange = useCallback((t) => {
    setTab(t)
    if (t === TABS.PLANNER || t === TABS.FAMILY) setPlannerOpen(true)
    if (t === TABS.JOURNAL) setInsightsOpen(true)
    if (t === TABS.TODAY)   { setPlannerOpen(false); setInsightsOpen(false) }
  }, [])

  const handleFetchFuture = useCallback((days) => {
    fetchDailyInner(usersRef.current, days)
  }, [])

  const handleReturnToday = useCallback(() => {
    fetchDailyInner(usersRef.current, 0)
  }, [])

  return {
    // State
    daily, status, tab, daysAhead, dateContext,
    identity, primaryUser, allUsers, profileStatus,
    saveMessage,
    // DTOs
    ...dtos, diagnostics,
    // Modals
    profileOpen, inviteOpen, insightsOpen, plannerOpen, onboardOpen,
    // Actions
    handleSaveProfile, handleOnboardComplete,
    handleFeedback, handleTabChange,
    handleFetchFuture, handleReturnToday,
    handleExport, handleImport, handleDeleteProfile,
    // Modal toggles
    openProfile:  () => setProfileOpen(true),
    closeProfile: () => setProfileOpen(false),
    openInvite:   () => setInviteOpen(true),
    closeInvite:  () => setInviteOpen(false),
    openInsights: () => setInsightsOpen(true),
    closeInsights:() => { setInsightsOpen(false); setTab(TABS.TODAY) },
    openPlanner:  () => setPlannerOpen(true),
    closePlanner: () => { setPlannerOpen(false); setTab(TABS.TODAY) },
    closeOnboard: () => setOnboardOpen(false)
  }
}
