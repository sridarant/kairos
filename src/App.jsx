import { useState, useEffect } from 'react'
import HomeScreen from './components/HomeScreen'
import ProfileModal from './components/ProfileModal'
import InviteModal from './components/InviteModal'
import InsightsModal from './components/InsightsModal'
import FamilyPlanModal from './components/FamilyPlanModal'
import BottomNav from './components/BottomNav'
import { getUserData, saveProfile, trackOpen, trackFeedback, computeAnalytics } from './lib/dataClient'

const MOCK_DAILY = {
  golden_window:'09:00–11:00', avoid_window:'17:00–19:00',
  focus:'Decision Making', confidence_summary:'Medium',
  why:'Mercury sharpens communication while Pushya nakshatra supports structured thinking.',
  signal:{ icon:'🟡', label:'Moderate Agreement', text:'Conditions are mixed — focus on your golden window.' },
  do_card:{ icon:'🟢', label:'Best Time', text:'Use 09:00–11:00 for your most important work.' },
  avoid_card:{ icon:'🔴', label:'Avoid', text:'Avoid new commitments after 17:00.' },
  watch_card:{ icon:'🟡', label:'Watch', text:'Energy shifts around 13:00.' },
  planet:'Mercury', lunar_phase:'Waxing', nakshatra:'Pushya', tithi:8, tithi_label:'growth phase',
  members:[{
    name:'You', golden_window:'09:00–11:00', stars:4, confidence:'Medium', focus:'Decision Making',
    do_advice:'Use 09:00–11:00 for your most important work.',
    avoid_advice:'Avoid commitments after 17:00.',
    watch_advice:'Energy shifts around 13:00.',
    summary:'Mercury sharpens communication. Focus in your morning window.',
    recommendations:{
      top:[
        { category:'career', icon:'💼', label:'Career', action:'Begin or advance your most important project.', reason:'Mercury supports clarity and planning.', best_time:'09:00–11:00', confidence:'Medium', stars:4, quality:'supportive' },
        { category:'communication', icon:'💬', label:'Communication', action:'Initiate key conversations and send important messages.', reason:'Mercury is the day ruler — communication flows well.', best_time:'09:00–11:00', confidence:'High', stars:5, quality:'supportive' },
        { category:'learning', icon:'🧠', label:'Learning', action:'Study complex material — absorption is high.', reason:'Focus dimension is elevated during Pushya.', best_time:'09:00–11:00', confidence:'Medium', stars:4, quality:'supportive' },
        { category:'relationships', icon:'❤️', label:'Relationships', action:'Reach out to important contacts.', reason:'Communication energy supports meaningful connection.', best_time:'11:00–13:00', confidence:'Medium', stars:3, quality:'mixed' },
        { category:'finance', icon:'💰', label:'Finance', action:'Review finances — defer major transactions.', reason:'Caution is warranted for significant moves.', best_time:'09:00–11:00', confidence:'Low', stars:2, quality:'caution' }
      ],
      rest:[]
    },
    timeline:[
      {time:'07:00',end:'09:00',quality:'Good',label:'Planning and review.'},
      {time:'09:00',end:'11:00',quality:'Excellent',label:'Decisions and important meetings.'},
      {time:'11:00',end:'13:00',quality:'Good',label:'Communication and outreach.'},
      {time:'13:00',end:'15:00',quality:'Moderate',label:'Light tasks and review.'},
      {time:'15:00',end:'17:00',quality:'Low energy',label:'Rest and recovery.'},
      {time:'17:00',end:'19:00',quality:'Moderate',label:'Family time and reflection.'}
    ]
  }],
  family_alignment:null,
  week_plan:[
    {label:'Today',date:'',days_ahead:0,stars:4,confidence:72,summary:'Highly favourable'},
    {label:'Tomorrow',date:'',days_ahead:1,stars:3,confidence:55,summary:'Moderately favourable'},
    {label:'Wednesday',date:'',days_ahead:2,stars:4,confidence:68,summary:'Highly favourable'},
    {label:'Thursday',date:'',days_ahead:3,stars:2,confidence:38,summary:'Rest and reflect'},
    {label:'Friday',date:'',days_ahead:4,stars:5,confidence:85,summary:'Highly favourable'},
    {label:'Saturday',date:'',days_ahead:5,stars:3,confidence:52,summary:'Moderately favourable'},
    {label:'Sunday',date:'',days_ahead:6,stars:4,confidence:70,summary:'Highly favourable'}
  ]
}

export default function App() {
  const [daily, setDaily]               = useState(null)
  const [loading, setLoading]           = useState(true)
  const [profileOpen, setProfileOpen]   = useState(false)
  const [inviteOpen, setInviteOpen]     = useState(false)
  const [insightsOpen, setInsightsOpen] = useState(false)
  const [familyPlanOpen, setFamilyPlanOpen] = useState(false)
  const [userData, setUserData]         = useState(null)

  useEffect(() => {
    async function init() {
      trackOpen()
      const data = await getUserData()
      setUserData(data)
      const users = data?.user_profile || []
      await fetchDaily(users, computeAnalytics(data?.history || []))
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
    } catch { setDaily(MOCK_DAILY) }
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
    // Refresh userData to reflect updated feedback in insights
    const data = await getUserData()
    setUserData(data)
  }

  const users       = userData?.user_profile || []
  const primaryUser = users[0] || null
  const feedbackAdj = computeAnalytics(userData?.history || [])

  return (
    <div style={{ maxWidth:448, margin:'0 auto', minHeight:'100dvh', position:'relative', paddingBottom:72 }}>
      <HomeScreen
        daily={daily} loading={loading}
        primaryUser={primaryUser} users={users} userData={userData}
        onProfileOpen={() => setProfileOpen(true)}
        onInvite={() => setInviteOpen(true)}
        onInsights={() => setInsightsOpen(true)}
        onFamilyPlan={() => setFamilyPlanOpen(true)}
        onFetchFuture={(days) => fetchDaily(users, feedbackAdj, days)}
        onFeedback={handleFeedback}
      />
      <BottomNav
        onHome={() => fetchDaily(users, feedbackAdj)}
        onInsights={() => setInsightsOpen(true)}
        onProfile={() => setProfileOpen(true)}
      />
      {profileOpen    && <ProfileModal onClose={() => setProfileOpen(false)} users={users} onSave={handleSaveUsers} />}
      {inviteOpen     && <InviteModal  onClose={() => setInviteOpen(false)} />}
      {insightsOpen   && <InsightsModal onClose={() => setInsightsOpen(false)} userData={userData} />}
      {familyPlanOpen && <FamilyPlanModal onClose={() => setFamilyPlanOpen(false)} users={users} daily={daily} />}
    </div>
  )
}
