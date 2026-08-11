/**
 * DesktopShell v30.8 — Light, minimal.
 *
 * Layout: compact nav (200px) | primary content | optional panel (300px)
 * No independently scrolling surfaces except the primary content area.
 * Context panel is scrolled within the primary column, not independently.
 */
import { ASYNC_STATE, TABS } from '../constants/index.js'
import { Surface, Text, Accent, Radius, Space, FontSize, FontWeight } from '../styles/tokens/index.js'
import { PROFILE_STATUS_COLOR } from '../app/config/userProfile.js'
import HomeScreen     from '../components/HomeScreen.jsx'
import PlannerScreen  from '../components/PlannerScreen.jsx'
import FamilyScreen   from '../components/FamilyScreen.jsx'
import InsightsScreen from '../components/InsightsScreen.jsx'
import ProfileModal   from '../components/ProfileModal.jsx'
import InviteModal    from '../components/InviteModal.jsx'
import TimelineSection  from '../components/pages/today/TimelineSection.jsx'
import TomorrowSection  from '../components/pages/today/TomorrowSection.jsx'
import { SkeletonCard } from '../components/common/index.jsx'

const NAV_ITEMS = [
  { id:TABS.TODAY,   label:'Today'    },
  { id:TABS.PLANNER, label:'Planner'  },
  { id:TABS.FAMILY,  label:'Family'   },
  { id:TABS.JOURNAL, label:'Insights' },
  { id:TABS.MORE,    label:'Settings' },
]

function SideNav({ active, onSelect, profileStatus, primaryUser, dateContext }) {
  const statusColor = PROFILE_STATUS_COLOR[profileStatus] || Text.Muted
  return (
    <div style={{ width:188, flexShrink:0, position:'sticky', top:0, height:'100vh',
      display:'flex', flexDirection:'column', paddingTop:Space['3xl'],
      borderRight:`1px solid ${Surface.Line}`, background:Surface.Base, overflowY:'auto' }}>

      {/* Logo/brand */}
      <div style={{ padding:`0 ${Space.xl}px ${Space['2xl']}px` }}>
        <p style={{ fontSize:FontSize.Heading3, fontWeight:FontWeight.Bold, color:Text.Primary, letterSpacing:'-0.02em' }}>
          Kairos
        </p>
        {dateContext && (
          <p style={{ fontSize:FontSize.Caption, color:Text.Muted, marginTop:2 }}>
            {dateContext.weekday}
          </p>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex:1, padding:`0 ${Space.md}px` }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => onSelect(item.id)}
            aria-current={active===item.id ? 'page' : undefined}
            style={{ width:'100%', display:'flex', alignItems:'center',
              padding:`${Space.sm}px ${Space.md}px`, marginBottom:4,
              background: active===item.id ? Surface.Subtle : 'none',
              border:'none', borderRadius:Radius.md, cursor:'pointer',
              fontFamily:'inherit', textAlign:'left', minHeight:38 }}>
            <span style={{ fontSize:FontSize.Body,
              color: active===item.id ? Text.Primary : Text.Secondary,
              fontWeight: active===item.id ? FontWeight.SemiBold : FontWeight.Regular }}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Profile status */}
      <div style={{ padding:`${Space.xl}px` }}>
        <p style={{ fontSize:FontSize.Caption, color:Text.Primary, fontWeight:FontWeight.Medium }}>
          {primaryUser?.name || 'Not set up'}
        </p>
        <p style={{ fontSize:FontSize.Badge, color:statusColor, marginTop:2 }}>
          {profileStatus === 'personalised' ? 'Personalised'
            : profileStatus === 'demo' ? 'Demo mode'
            : 'Incomplete'}
        </p>
      </div>
    </div>
  )
}

function ContextPanel({ bs, activeTab, loading }) {
  const style = {
    width:280, flexShrink:0, padding:`${Space['3xl']}px ${Space.xl}px`,
    borderLeft:`1px solid ${Surface.Line}`, background:Surface.Base
  }
  if (loading) return (
    <div style={style}><SkeletonCard lines={3}/><SkeletonCard lines={2}/></div>
  )
  if (activeTab === TABS.TODAY) return (
    <div style={style}>
      <TimelineSection timeline={bs.timeline} />
      <div style={{ marginTop:Space['3xl'] }}>
        <TomorrowSection brief={bs.brief} onFetchFuture={bs.handleFetchFuture} />
      </div>
    </div>
  )
  if (activeTab === TABS.PLANNER) return (
    <div style={style}>
      <p style={{ fontSize:FontSize.Label, textTransform:'uppercase', letterSpacing:'0.08em',
        color:Text.Muted, fontWeight:FontWeight.Medium, marginBottom:Space.xl }}>
        Coming up
      </p>
      <p style={{ fontSize:FontSize.Caption, color:Text.Secondary }}>
        {bs.dateContext?.weekLabel}
      </p>
    </div>
  )
  if (activeTab === TABS.FAMILY) return (
    <div style={style}>
      <TimelineSection timeline={bs.timeline} />
    </div>
  )
  return <div style={style} />
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
      maxWidth:1440, margin:'0 auto' }}>

      <SideNav active={activeTab} onSelect={handleNav}
        profileStatus={bs.profileStatus} primaryUser={bs.primaryUser}
        dateContext={bs.dateContext} />

      {/* Primary content */}
      <div style={{ flex:1, minWidth:0, maxWidth:660, overflowY:'auto', height:'100vh' }}>
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
          <PlannerScreen weeklyPlan={bs.weeklyPlan} opportunities={bs.opportunities}
            daily={bs.daily} dateContext={bs.dateContext} allUsers={bs.allUsers}
            onFetchFuture={bs.handleFetchFuture} onReturnToday={bs.handleReturnToday} />
        )}
        {activeTab === TABS.FAMILY && (
          <FamilyScreen brief={bs.brief} daily={bs.daily} members={bs.members}
            weeklyPlan={bs.weeklyPlan} dateContext={bs.dateContext} identity={bs.identity}
            onFetchFuture={bs.handleFetchFuture} />
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
