/**
 * DesktopShell v30.5 — True route-based navigation with context panel.
 *
 * Architecture:
 *   SideNav | PrimaryContent | ContextPanel
 *
 * PrimaryContent changes completely based on tab.
 * Today content is NEVER shown when Planner or Family is active.
 * Context panel provides complementary info (timeline, upcoming, day detail).
 */
import { ASYNC_STATE, TABS } from '../constants/index.js'
import { Surface, Text, Accent, Radius, Space, FontSize, FontWeight } from '../styles/tokens/index.js'
import { PROFILE_STATUS_COLOR } from '../app/config/userProfile.js'
import Logo           from '../components/Logo.jsx'
import HomeScreen     from '../components/HomeScreen.jsx'
import PlannerScreen  from '../components/PlannerScreen.jsx'
import FamilyScreen   from '../components/FamilyScreen.jsx'
import InsightsScreen from '../components/InsightsScreen.jsx'
import ProfileModal   from '../components/ProfileModal.jsx'
import InviteModal    from '../components/InviteModal.jsx'
import TimelineSection  from '../components/pages/today/TimelineSection.jsx'
import TomorrowSection  from '../components/pages/today/TomorrowSection.jsx'
import UpcomingSection  from '../components/pages/today/UpcomingSection.jsx'
import { SkeletonCard } from '../components/common/index.jsx'

const NAV_ITEMS = [
  { id: TABS.TODAY,   icon:'🏠', label:'Today'    },
  { id: TABS.PLANNER, icon:'📅', label:'Planner'  },
  { id: TABS.FAMILY,  icon:'👨‍👩‍👧', label:'Family'   },
  { id: TABS.JOURNAL, icon:'💡', label:'Insights' },
  { id: TABS.MORE,    icon:'⚙️',  label:'Settings' },
]

function SideNav({ active, onSelect, profileStatus, primaryUser, dateContext }) {
  const statusColor = PROFILE_STATUS_COLOR[profileStatus] || '#666'
  return (
    <div style={{ width:220, flexShrink:0, position:'sticky', top:0, height:'100vh',
      display:'flex', flexDirection:'column', padding:`${Space['3xl']}px ${Space.xl}px`,
      borderRight:`1px solid ${Surface.Line}`, background:Surface.Base,
      overflowY:'auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap:Space.sm, marginBottom:Space['2xl'] }}>
        <Logo />
        <span style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Bold, color:Text.Primary }}>Kairos</span>
      </div>
      {dateContext && (
        <div style={{ marginBottom:Space.xl }}>
          <p style={{ fontSize:FontSize.Heading3, fontWeight:FontWeight.Heavy,
            color:dateContext.daysAhead > 0 ? Accent : Text.Primary, lineHeight:1 }}>
            {dateContext.relativeLabel}
          </p>
          <p style={{ fontSize:FontSize.Caption, color:Text.Secondary, marginTop:2 }}>
            {dateContext.weekday}, {dateContext.dayMonth}
          </p>
        </div>
      )}
      <nav style={{ flex:1 }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => onSelect(item.id)}
            aria-current={active === item.id ? 'page' : undefined}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:Space.md,
              padding:`10px ${Space.md}px`, marginBottom:Space.xs,
              background: active === item.id ? `${Accent}15` : 'none',
              border:'none', borderRadius:Radius.md, cursor:'pointer', fontFamily:'inherit',
              textAlign:'left', minHeight:42,
              borderLeft: active === item.id ? `3px solid ${Accent}` : '3px solid transparent' }}>
            <span style={{ fontSize:18 }}>{item.icon}</span>
            <span style={{ fontSize:FontSize.Body,
              color: active === item.id ? Accent : Text.Secondary,
              fontWeight: active === item.id ? FontWeight.Bold : 400 }}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>
      <div style={{ background:Surface.Card, borderRadius:Radius.lg, padding:`${Space.sm}px ${Space.md}px` }}>
        <p style={{ fontSize:FontSize.Caption, fontWeight:FontWeight.Bold, color:Text.Primary, marginBottom:2 }}>
          {primaryUser?.name || 'Demo Mode'}
        </p>
        <div style={{ display:'flex', alignItems:'center', gap:Space.xs }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:statusColor, flexShrink:0 }} />
          <p style={{ fontSize:FontSize.Badge, color:statusColor }}>
            {profileStatus === 'personalised' ? 'Personalised'
              : profileStatus === 'basic' ? 'Partially set up'
              : profileStatus === 'incomplete' ? 'Incomplete'
              : 'Demo mode'}
          </p>
        </div>
      </div>
    </div>
  )
}

// Context panel content changes per route
function ContextPanel({ bs, activeTab, loading }) {
  const style = {
    width:340, flexShrink:0, position:'sticky', top:0, height:'100vh',
    overflowY:'auto', borderLeft:`1px solid ${Surface.Line}`,
    padding:`${Space['3xl']}px ${Space.xl}px`, background:Surface.Base
  }

  if (loading) return (
    <div style={style}><SkeletonCard lines={4} /><SkeletonCard lines={2} /></div>
  )

  // Today: timeline + tomorrow
  if (activeTab === TABS.TODAY) return (
    <div style={style}>
      <p style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Bold,
        color:Text.Primary, marginBottom:Space.xl }}>Timeline</p>
      <TimelineSection timeline={bs.timeline} />
      <TomorrowSection brief={bs.brief} onFetchFuture={bs.handleFetchFuture} />
    </div>
  )

  // Planner: upcoming opportunities
  if (activeTab === TABS.PLANNER) return (
    <div style={style}>
      <p style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Bold,
        color:Text.Primary, marginBottom:Space.xs }}>Coming Up</p>
      <p style={{ fontSize:FontSize.Caption, color:Text.Secondary, marginBottom:Space.xl }}>
        {bs.dateContext?.weekLabel}
      </p>
      <UpcomingSection opportunities={bs.opportunities} weeklyPlan={bs.weeklyPlan}
        onFetchFuture={bs.handleFetchFuture} />
    </div>
  )

  // Family: show primary user timeline or selected member's timeline
  if (activeTab === TABS.FAMILY) return (
    <div style={style}>
      <p style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Bold,
        color:Text.Primary, marginBottom:Space.xl }}>Today's Timeline</p>
      <TimelineSection timeline={bs.timeline} />
    </div>
  )

  // Insights / Settings
  return (
    <div style={style}>
      <p style={{ fontSize:FontSize.Caption, color:Text.Secondary }}>Kairos · Life Planning</p>
    </div>
  )
}

export default function DesktopShell({ bs }) {
  const loading   = bs.status === ASYNC_STATE.LOADING
  const activeTab = bs.tab

  function handleNav(tab) {
    if (tab === TABS.MORE) { bs.openProfile(); return }
    bs.setTab(tab)
    if (tab === TABS.TODAY) bs.handleReturnToday()
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:Surface.Background,
      maxWidth:1600, margin:'0 auto' }}>
      <SideNav active={activeTab} onSelect={handleNav}
        profileStatus={bs.profileStatus} primaryUser={bs.primaryUser}
        dateContext={bs.dateContext} />

      {/* Primary content — changes completely per tab */}
      <div style={{ flex:1, minWidth:0, maxWidth:680, overflowY:'auto',
        padding:`${Space['3xl']}px ${Space['3xl']}px`, height:'100vh' }}>

        {activeTab === TABS.TODAY && (
          <HomeScreen
            brief={bs.brief} recommendationPackages={bs.recommendationPackages}
            timeline={bs.timeline} weeklyPlan={bs.weeklyPlan}
            opportunities={bs.opportunities} daily={bs.daily}
            loading={loading} status={bs.status}
            primaryUser={bs.primaryUser} profileStatus={bs.profileStatus}
            dateContext={bs.dateContext} diagnostics={bs.diagnostics}
            onProfileOpen={bs.openProfile} onInvite={bs.openInvite}
            onFetchFuture={bs.handleFetchFuture} onReturnToday={bs.handleReturnToday}
            onFeedback={bs.handleFeedback} showTimeline={false}
          />
        )}

        {activeTab === TABS.PLANNER && (
          <PlannerScreen
            weeklyPlan={bs.weeklyPlan} opportunities={bs.opportunities}
            daily={bs.daily} dateContext={bs.dateContext}
            allUsers={bs.allUsers}
            onFetchFuture={bs.handleFetchFuture}
            onReturnToday={bs.handleReturnToday}
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

      <ContextPanel bs={bs} activeTab={activeTab} loading={loading} />

      {bs.profileOpen && (
        <ProfileModal onClose={bs.closeProfile} identity={bs.identity}
          onSave={bs.handleSaveProfile} onExport={bs.handleExport}
          onImport={bs.handleImport} onDelete={bs.handleDeleteProfile} />
      )}
      {bs.inviteOpen && <InviteModal onClose={bs.closeInvite} />}
    </div>
  )
}
