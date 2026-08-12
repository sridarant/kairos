/**
 * TabletShell v30.5 — True route-based navigation for 768–1199px.
 * Sidebar nav + primary content area. No modal overlays for Planner/Family.
 */
import { ASYNC_STATE, TABS } from '../constants/index.js'
import { Surface, Text, Accent, Radius, Space, FontSize, FontWeight } from '../styles/tokens/index.js'
import { PROFILE_STATUS_COLOR } from '../app/config/userProfile.js'
import Logo           from '../components/Logo.jsx'
import HomeScreen     from '../components/HomeScreen.jsx'
import PlannerScreen  from '../components/PlannerScreen.jsx'
import FamilyScreen   from '../components/FamilyScreen.jsx'
import InsightsScreen from '../components/InsightsScreen.jsx'
import SettingsScreen from '../components/SettingsScreen.jsx'
import InviteModal    from '../components/InviteModal.jsx'

const NAV_ITEMS = [
  { id:TABS.TODAY,   icon:'🏠', label:'Today'    },
  { id:TABS.PLANNER, icon:'📅', label:'Planner'  },
  { id:TABS.FAMILY,  icon:'👨‍👩‍👧', label:'Family'   },
  { id:TABS.JOURNAL, icon:'💡', label:'Insights' },
  { id:TABS.MORE,    icon:'◦',   label:'Settings' },
]

function SideNav({ active, onSelect, profileStatus, primaryUser }) {
  const statusColor = PROFILE_STATUS_COLOR[profileStatus] || Text.Muted
  return (
    <div style={{ width:200, flexShrink:0, position:'sticky', top:0, height:'100vh',
      display:'flex', flexDirection:'column', padding:`${Space['3xl']}px ${Space.xl}px`,
      borderRight:`1px solid ${Surface.Line}`, background:Surface.Base, overflowY:'auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap:Space.sm, marginBottom:Space['3xl'] }}>
        <Logo />
        <span style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Bold, color:Text.Primary }}>Kairos</span>
      </div>
      <div style={{ background:Surface.Card, borderRadius:Radius.lg, padding:`${Space.sm}px ${Space.md}px`,
        marginBottom:Space['2xl'] }}>
        <p style={{ fontSize:FontSize.Caption, color:Text.Secondary, marginBottom:2 }}>
          {primaryUser?.name || 'Demo Mode'}
        </p>
        <div style={{ display:'flex', alignItems:'center', gap:Space.xs }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:statusColor, flexShrink:0 }} />
          <p style={{ fontSize:FontSize.Badge, color:statusColor }}>
            {profileStatus === 'personalised' ? 'Personalised' : 'Demo mode'}
          </p>
        </div>
      </div>
      <nav style={{ flex:1 }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => onSelect(item.id)}
            aria-current={active === item.id ? 'page' : undefined}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:Space.md,
              padding:`${Space.sm}px ${Space.md}px`, marginBottom:Space.xs,
              background: active === item.id ? Surface.Subtle : 'none',
              border:'none', borderRadius:Radius.md, cursor:'pointer', fontFamily:'inherit',
              textAlign:'left', minHeight:40,
              borderLeft:'3px solid transparent' }}>
            <span style={{ fontSize:18 }}>{item.icon}</span>
            <span style={{ fontSize:FontSize.Body,
              color: active === item.id ? Text.Primary : Text.Secondary,
              fontWeight: active === item.id ? FontWeight.Bold : 400 }}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default function TabletShell({ bs }) {
  const loading   = bs.status === ASYNC_STATE.LOADING
  const activeTab = bs.tab

  function handleNav(tab) {
    // R2.4A: Settings is a page
    bs.setTab(tab)
    if (tab === TABS.TODAY) bs.handleReturnToday()
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:Surface.Background }}>
      <SideNav active={activeTab} onSelect={handleNav}
        profileStatus={bs.profileStatus} primaryUser={bs.primaryUser} />

      <div style={{ flex:1, overflowY:'auto', minWidth:0, maxWidth:680 }}>
        {activeTab === TABS.TODAY && (
          <HomeScreen
            brief={bs.brief} recommendationPackages={bs.recommendationPackages}
            timeline={bs.timeline} weeklyPlan={bs.weeklyPlan}
            opportunities={bs.opportunities} daily={bs.daily}
            loading={loading} status={bs.status}
            primaryUser={bs.primaryUser} profileStatus={bs.profileStatus}
            dateContext={bs.dateContext} diagnostics={bs.diagnostics}
            onProfileOpen={() => bs.setTab(TABS.MORE)} onInvite={bs.openInvite}
            onFetchFuture={bs.handleFetchFuture} onReturnToday={bs.handleReturnToday}
            onFeedback={bs.handleFeedback}
          />
        )}
        {activeTab === TABS.PLANNER && (
          <PlannerScreen
            weeklyPlan={bs.weeklyPlan} opportunities={bs.opportunities}
            daily={bs.daily} dateContext={bs.dateContext}
            allUsers={bs.allUsers}
            onFetchFuture={bs.handleFetchFuture} onReturnToday={bs.handleReturnToday}
          />
        )}
        {activeTab === TABS.FAMILY && (
          <FamilyScreen
            brief={bs.brief} daily={bs.daily} members={bs.members} weeklyPlan={bs.weeklyPlan}
            dateContext={bs.dateContext} identity={bs.identity}
            onFetchFuture={bs.handleFetchFuture}
          />
        )}
        {activeTab === TABS.JOURNAL && (
          <InsightsScreen identity={bs.identity} />
        )}
      </div>

      {bs.profileOpen && (
        <ProfileModal onClose={bs.closeProfile} identity={bs.identity}
          onSave={bs.handleSaveProfile} onExport={bs.handleExport}
          onImport={bs.handleImport} onDelete={bs.handleDeleteProfile} />
      )}
      {bs.inviteOpen && <InviteModal onClose={bs.closeInvite} />}
    </div>
  )
}
