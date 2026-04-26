import { useState, useEffect } from 'react'
import HomeScreen from './components/HomeScreen'
import AskModal from './components/AskModal'
import ProfileModal from './components/ProfileModal'
import InviteModal from './components/InviteModal'
import BottomNav from './components/BottomNav'
import { loadHistory, computeFeedbackAdj } from './lib/history'

const MOCK_DAILY = {
  golden_window: '09:00–11:00',
  avoid_window: '17:00–19:00',
  do: 'Tackle complex work requiring full focus',
  avoid: '17:00–19:00 — Avoid financial decisions — risk tolerance is low',
  watch: '13:00–15:00 — Energy dip likely — pace yourself',
  planet: 'Mercury',
  confidence_summary: 75,
  members: []
}

function loadUsers() {
  try { return JSON.parse(localStorage.getItem('kairos_users') || '[]') } catch { return [] }
}
function saveUsers(users) {
  try { localStorage.setItem('kairos_users', JSON.stringify(users)) } catch {}
}

export default function App() {
  const [daily, setDaily]             = useState(null)
  const [loading, setLoading]         = useState(true)
  const [askOpen, setAskOpen]         = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [inviteOpen, setInviteOpen]   = useState(false)
  const [users, setUsers]             = useState(loadUsers)
  const [feedbackAdj, setFeedbackAdj] = useState(() => computeFeedbackAdj(loadHistory()))

  useEffect(() => { fetchDaily(users) }, [])

  // Recompute feedback adjustments whenever the modal closes (after possible feedback)
  function handleAskClose() {
    setAskOpen(false)
    setFeedbackAdj(computeFeedbackAdj(loadHistory()))
  }

  async function fetchDaily(currentUsers) {
    setLoading(true)
    try {
      const res = await fetch('/api/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: currentUsers, feedbackAdj })
      })
      if (!res.ok) throw new Error()
      setDaily(await res.json())
    } catch {
      setDaily(MOCK_DAILY)
    } finally {
      setLoading(false)
    }
  }

  function handleSaveUsers(updated) {
    setUsers(updated)
    saveUsers(updated)
    fetchDaily(updated)
  }

  const primaryUser = users[0] || null

  return (
    <div style={{ maxWidth: 448, margin: '0 auto', minHeight: '100dvh', position: 'relative', paddingBottom: 72 }}>
      <HomeScreen
        daily={daily}
        loading={loading}
        primaryUser={primaryUser}
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
