/**
 * /src/hooks/useBootstrap.js v30.5
 *
 * State and actions. No routing logic — shells handle route rendering.
 * setTab exposed directly. No plannerOpen/closePlanner modal state.
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  initialiseApp, fetchDailyAPI, buildApplicationDTOs,
  buildDevDiagnostics, buildDateContext, identityManager
} from '../app/bootstrap/BootstrapManager.js'
import { ASYNC_STATE, TABS } from '../constants/index.js'

const _init = initialiseApp()  // synchronous — identity loaded before first render

export function useBootstrap() {
  const [daily,         setDaily]         = useState(null)
  const [status,        setStatus]        = useState(ASYNC_STATE.LOADING)
  const [daysAhead,     setDaysAhead]     = useState(0)
  const [tab,           setTab]           = useState(TABS.TODAY)
  const [identity,      setIdentity]      = useState(_init.identity)
  const [profileStatus, setProfileStatus] = useState(_init.profileStatus)
  // profileOpen removed R2.4A — Settings is a page, no modal needed
  const [inviteOpen,    setInviteOpen]    = useState(false)
  const [onboardOpen,   setOnboardOpen]   = useState(!identityManager.isOnboarded)
  const [saveMessage,   setSaveMessage]   = useState(null)

  const usersRef = useRef(_init.users)

  // Subscribe to identity changes
  useEffect(() => {
    return identityManager.subscribe(newId => {
      setIdentity(newId)
      setProfileStatus(identityManager.profileStatus)
      usersRef.current = identityManager.allUsers
    })
  }, [])

  // Initial fetch
  useEffect(() => {
    let cancelled = false
    fetchDailyInner(_init.users, 0, () => cancelled)
    return () => { cancelled = true }
  }, [])

  async function fetchDailyInner(users, days, isCancelled) {
    setStatus(ASYNC_STATE.LOADING)
    try {
      const raw = await fetchDailyAPI(users, days)
      if (isCancelled?.()) return
      setDaily(raw); setDaysAhead(days); setStatus(ASYNC_STATE.SUCCESS)
    } catch (err) {
      if (isCancelled?.()) return
      console.error('[Bootstrap] fetch failed:', err.message)
      setDaily(null); setStatus(ASYNC_STATE.ERROR)
    }
  }

  const primaryUser = useMemo(() => identityManager.primaryUser, [identity])
  const allUsers    = useMemo(() => identityManager.allUsers,    [identity])
  const feedbackHist= useMemo(() => identity?.appState?.feedbackHistory || [], [identity])
  const dateContext = useMemo(() => buildDateContext(daysAhead), [daysAhead])
  const dtos        = useMemo(() => buildApplicationDTOs(daily, feedbackHist), [daily, feedbackHist])
  const diagnostics = useMemo(() => buildDevDiagnostics(dtos), [dtos])

  const handleSaveProfile = useCallback(async (profileFields, familyArray = []) => {
    identityManager.saveProfile(profileFields, familyArray)
    setSaveMessage('Profile saved.')
    setTimeout(() => setSaveMessage(null), 3000)
    await fetchDailyInner(identityManager.allUsers, 0)
  }, [])

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
    } catch(e) { console.error('Export failed:', e) }
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

  const handleFetchFuture = useCallback(days => fetchDailyInner(usersRef.current, days), [])
  const handleReturnToday = useCallback(()    => fetchDailyInner(usersRef.current, 0),    [])

  return {
    daily, status, tab, setTab, daysAhead, dateContext,
    identity, primaryUser, allUsers, profileStatus, saveMessage,
    ...dtos, diagnostics,
    inviteOpen, onboardOpen,
    handleSaveProfile, handleOnboardComplete,
    handleFeedback, handleFetchFuture, handleReturnToday,
    handleExport, handleImport, handleDeleteProfile,
    // openProfile removed R2.4A
    // closeProfile removed R2.4A
    openInvite:   () => setInviteOpen(true),
    closeInvite:  () => setInviteOpen(false),
    closeOnboard: () => setOnboardOpen(false),
  }
}
