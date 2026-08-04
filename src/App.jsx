import { useState, useEffect, useCallback } from 'react'
import HomeScreen from './components/HomeScreen'
import ProfileModal from './components/ProfileModal'
import InviteModal from './components/InviteModal'
import InsightsModal from './components/InsightsModal'
import FamilyPlanModal from './components/FamilyPlanModal'
import BottomNav from './components/BottomNav'
import { getUserData, saveProfile, trackOpen, computeAnalytics } from './lib/dataClient'

const MOCK_DAILY = {
  golden_window:'09:00–11:00', avoid_window:'17:00–19:00', stars:4, focus:'Decision Making',
  signal:{ icon:'🟢', label:'Strong Signal', text:'Excellent conditions for important decisions.' },
  do_card:{ icon:'🟢', label:'Best Time', text:'Use 09:00–11:00 for your most important work.' },
  avoid_card:{ icon:'🔴', label:'Avoid', text:'Avoid starting new commitments after 17:00.' },
  watch_card:{ icon:'🟡', label:'Watch', text:'Energy shifts around 13:00 — pace accordingly.' },
  planet:'Mercury', lunar_phase:'Waxing', nakshatra:'Pushya', tithi:8,
  members:[{ name:'You', golden_window:'09:00–11:00', stars:4, confidence:75, focus:'Decision Making',
    do_advice:'Use 09:00–11:00 for your most important work.', avoid_advice:'Avoid commitments after 17:00.',
    watch_advice:'Energy shifts around 13:00.', categories:{
      career:{stars:4,advice:'Focus on high-impact tasks this morning'},
      money:{stars:3,advice:'Review budgets and pending payments'},
      relationships:{stars:4,advice:'Excellent for important conversations'},
      health:{stars:3,advice:'Moderate activity supports better outcomes'},
      learning:{stars:4,advice:'Peak absorption time — study in your golden window'}
    },
    timeline:[{time:'07:00',quality:'Good',label:'Good time for planning and review.'},{time:'09:00',quality:'Excellent',label:'Excellent for meetings and decisions.'},{time:'11:00',quality:'Moderate',label:'Rest or light tasks.'},{time:'13:00',quality:'Good',label:'Good for family conversations.'},{time:'15:00',quality:'Low energy',label:'Wind down and reflect.'},{time:'17:00',quality:'Moderate',label:'Gentle conversations and family time.'}]
  }],
  family_alignment:null,
  week_plan:[],
  confidence_summary:75
}

export default function App() {
  const [daily, setDaily]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [screen, setScreen]         = useState('home')    // home | insights | planning
  const [profileOpen, setProfileOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [insightsOpen, setInsightsOpen] = useState(false)
  const [familyPlanOpen, setFamilyPlanOpen] = useState(false)
  const [userData, setUserData]     = useState(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    async function init() {
      trackOpen()
      const data = await getUserData()
      setUserData(data)
      const users = data?.user_profile || []
      await fetchDaily(users, computeAnalytics(data?.history || []))
      setInitialized(true)
    }
    init()
  }, [])

  async function fetchDaily(users, feedbackAdj, daysAhead = 0) {
    setLoading(true)
    try {
      const res = await fetch('/api/daily', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ users: users || [], feedbackAdj, daysAhead })
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
    await fetchDaily(updatedUsers, computeAnalytics(freshData.history || []))
  }

  const users       = userData?.user_profile || []
  const primaryUser = users[0] || null
  const feedbackAdj = computeAnalytics(userData?.history || [])

  return (
    <div style={{ maxWidth: 448, margin:'0 auto', minHeight:'100dvh', position:'relative', paddingBottom: 72 }}>
      <HomeScreen
        daily={daily}
        loading={loading}
        primaryUser={primaryUser}
        users={users}
        userData={userData}
        onProfileOpen={() => setProfileOpen(true)}
        onInvite={() => setInviteOpen(true)}
        onInsights={() => setInsightsOpen(true)}
        onFamilyPlan={() => setFamilyPlanOpen(true)}
        onFetchFuture={(days) => fetchDaily(users, feedbackAdj, days)}
      />
      <BottomNav
        onHome={() => setScreen('home')}
        onInsights={() => setInsightsOpen(true)}
        onProfile={() => setProfileOpen(true)}
      />
      {profileOpen   && <ProfileModal onClose={() => setProfileOpen(false)} users={users} onSave={handleSaveUsers} />}
      {inviteOpen    && <InviteModal  onClose={() => setInviteOpen(false)} />}
      {insightsOpen  && <InsightsModal onClose={() => setInsightsOpen(false)} userData={userData} />}
      {familyPlanOpen && <FamilyPlanModal onClose={() => setFamilyPlanOpen(false)} users={users} daily={daily} />}
    </div>
  )
}
