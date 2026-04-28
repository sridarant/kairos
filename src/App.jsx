import { useState, useEffect } from 'react'
import HomeScreen from './components/HomeScreen'
import AskModal from './components/AskModal'
import ProfileModal from './components/ProfileModal'
import InviteModal from './components/InviteModal'
import BottomNav from './components/BottomNav'
import { getUserData, saveProfile, trackOpen, computeAnalytics } from './lib/dataClient'

const MOCK_DAILY = {
  golden_window: '09:00–11:00', avoid_window: '17:00–19:00',
  do: 'Use this window for key decisions and important conversations',
  avoid: '17:00–19:00 — Do not make financial decisions — risk clarity is low',
  watch: '13:00–15:00 — Energy will dip — schedule breaks before it affects focus',
  planet: 'Mercury', lunar_phase: 'Waxing', nakshatra: 'Pushya', tithi: 8,
  confidence_summary: 75, members: []
}

export default function App() {
  const [daily, setDaily]             = useState(null)
  const [loading, setLoading]         = useState(true)
  const [askOpen, setAskOpen]         = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [inviteOpen, setInviteOpen]   = useState(false)
  // Central data state — replaces scattered localStorage reads
  const [userData, setUserData]       = useState(null)

  // Load all user data from API on mount
  useEffect(() => {
    async function init() {
      trackOpen()
      const data = await getUserData()
      setUserData(data)
      const users = data.user_profile || []
      await fetchDaily(users, computeAnalytics(data.history))
    }
    init()
  }, [])

  async function fetchDaily(users, feedbackAdj) {
    setLoading(true)
    try {
      const res = await fetch('/api/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: users || [], feedbackAdj })
      })
      if (!res.ok) throw new Error()
      setDaily(await res.json())
    } catch {
      setDaily(MOCK_DAILY)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveUsers(updatedUsers) {
    await saveProfile(updatedUsers)
    const freshData = { ...userData, user_profile: updatedUsers }
    setUserData(freshData)
    await fetchDaily(updatedUsers, computeAnalytics(freshData.history))
  }

  // Refresh userData after ask modal closes (new history entry may exist)
  async function handleAskClose() {
    setAskOpen(false)
    const data = await getUserData()
    setUserData(data)
  }

  const users       = userData?.user_profile || []
  const primaryUser = users[0] || null
  const feedbackAdj = computeAnalytics(userData?.history || [])

  return (
    <div style={{ maxWidth: 448, margin: '0 auto', minHeight: '100dvh', position: 'relative', paddingBottom: 72 }}>
      <HomeScreen
        daily={daily}
        loading={loading}
        primaryUser={primaryUser}
        userData={userData}
        onProfileOpen={() => setProfileOpen(true)}
        onInvite={() => setInviteOpen(true)}
      />
      <BottomNav onAsk={() => setAskOpen(true)} onProfile={() => setProfileOpen(true)} />
      {askOpen     && <AskModal onClose={handleAskClose} profile={primaryUser} feedbackAdj={feedbackAdj} />}
      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} users={users} onSave={handleSaveUsers} />}
      {inviteOpen  && <InviteModal onClose={() => setInviteOpen(false)} />}
    </div>
  )
}
