/**
 * /src/hooks/useBootstrap.js v30.3.1
 *
 * Fix: initialiseApp() is now called synchronously during hook initialization,
 * NOT inside useEffect. This ensures profileStatus and identity are correct
 * from the very FIRST render — no flash of Demo Mode.
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  initialiseApp, fetchDailyAPI, buildApplicationDTOs,
  buildDevDiagnostics, buildDateContext, computeFeedbackPrefs,
  identityManager
} from '../app/bootstrap/BootstrapManager.js'
import { ASYNC_STATE, TABS } from '../constants/index.js'

// ─── Synchronous initialisation (runs once, before first render) ──────────────
// This is the critical fix: identity is loaded from localStorage synchronously
// so React has the correct profileStatus on the very first render.
const _init = initialiseApp()

export function useBootstrap() {
  // Initialise from _init so first render already has correct identity state
  const [daily,         setDaily]         = useState(null)
  const [status,        setStatus]        = useState(ASYNC_STATE.LOADING)
  const [daysAhead,     setDaysAhead]     = useState(0)
  const [tab,           setTab]           = useState(TABS.TODAY)
  const [identity,      setIdentity]      = useState(_init.identity)
  const [profileStatus, setProfileStatus] = useState(_init.profileStatus)
  const [onboardOpen,   setOnboardOpen]   = useState(!identityManager.isOnboarded)
  const [profileOpen,   setProfileOpen]   = useState(false)
  const [inviteOpen,    setInviteOpen]    = useState(false)
  const [insightsOpen,  setInsightsOpen]  = useState(false)
  const [plannerOpen,   setPlannerOpen]   = useState(false)
  const [saveMessage,   setSaveMessage]   = useState(null)

  const usersRef = useRef(_init.users)

  // ── Subscribe to IdentityManager changes ──────────────────────────────────
  useEffect(() => {
    const unsub = identityManager.subscribe((newIdentity) => {
      setIdentity(newIdentity)
      setProfileStatus(identityManager.profileStatus)
      usersRef.current = identityManager.userProfileArray
    })
    return unsub
  }, [])

  // ── Fetch recommendations on mount (identity already loaded above) ────────
  useEffect(() => {
    let cancelled = false
    async function fetchInitial() {
      try {
        await loadDailyInner(_init.users, {}, 0, cancelled)
      } catch (err) {
        if (!cancelled) { console.error('[Bootstrap] initial fetch failed:', err.message); setStatus(ASYNC_STATE.ERROR) }
      }
    }
    fetchInitial()
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch daily ───────────────────────────────────────────────────────────
  async function loadDailyInner(users, feedbackAdj, days, cancelledRef) {
    setStatus(ASYNC_STATE.LOADING)
    try {
      const raw = await fetchDailyAPI(users, feedbackAdj, days)
      if (cancelledRef === true) return  // handle the boolean cancel flag
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
    daily, status, tab, daysAhead, dateContext,
    identity, primaryUser, users, profileStatus,
    saveMessage,
    ...dtos, diagnostics,
    profileOpen, inviteOpen, insightsOpen, plannerOpen, onboardOpen,
    handleSaveUsers, handleFeedback, handleTabChange,
    handleFetchFuture, handleReturnToday,
    handleExportProfile, handleImportProfile, handleDeleteProfile,
    handleOnboardComplete,
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
