/**
 * DesktopShell — full dashboard experience for 1200px+
 *
 * Three-zone layout:
 *   Left sidebar (220px)   — nav + profile + date context
 *   Main column (flex)     — primary content (brief + recommendations)
 *   Right panel (340px)    — secondary content (planner / family / week / timeline)
 *
 * Right panel content changes based on active tab.
 * No modals. No bottom nav. No overlays.
 * Everything visible at once.
 */
import Logo from '../components/Logo.jsx'
import DemoBanner    from '../components/common/DemoBanner.jsx'
import DateHeader    from '../components/common/DateHeader.jsx'
import { SkeletonCard, SkeletonHero } from '../components/common/index.jsx'
import MorningBriefSection   from '../components/pages/today/MorningBriefSection.jsx'
import RecommendationSection from '../components/pages/today/RecommendationSection.jsx'
import TimelineSection       from '../components/pages/today/TimelineSection.jsx'
import FamilyBriefSection    from '../components/pages/today/FamilyBriefSection.jsx'
import TomorrowSection       from '../components/pages/today/TomorrowSection.jsx'
import DiagnosticsPanel      from '../components/pages/today/DiagnosticsPanel.jsx'
import ThisWeekSection       from '../components/pages/today/ThisWeekSection.jsx'
import UpcomingSection       from '../components/pages/today/UpcomingSection.jsx'
import ProfileModal  from '../components/ProfileModal.jsx'
import InviteModal   from '../components/InviteModal.jsx'
import InsightsModal from '../components/InsightsModal.jsx'
import { Surface, Text, Accent, Radius, Space, FontSize, FontWeight } from '../styles/tokens/index.js'
import { PROFILE_STATUS_COLOR } from '../app/config/userProfile.js'
import { ASYNC_STATE, TABS } from '../constants/index.js'

const NAV_ITEMS = [
  { id: TABS.TODAY,   icon:'🏠', label:'Today'   },
  { id: TABS.PLANNER, icon:'📅', label:'Planner' },
  { id: TABS.FAMILY,  icon:'👨‍👩‍👧', label:'Family'  },
  { id: TABS.JOURNAL, icon:'📖', label:'Journal' },
  { id: TABS.MORE,    icon:'⚙️',  label:'Settings'},
]

// ─── Left sidebar ─────────────────────────────────────────────────────────────
function SideNav({ active, onSelect, profileStatus, primaryUser, dateContext }) {
  const statusColor = PROFILE_STATUS_COLOR[profileStatus] || '#666'
  return (
    <div style={{ width:220, flexShrink:0, position:'sticky', top:0, height:'100vh',
      display:'flex', flexDirection:'column', padding:`${Space['3xl']}px ${Space.xl}px`,
      borderRight:`1px solid ${Surface.Line}`, background: Surface.Base }}>
      {/* Brand */}
      <div style={{ display:'flex', alignItems:'center', gap: Space.sm, marginBottom: Space['2xl'] }}>
        <Logo />
        <span style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold, color: Text.Primary }}>
          Kairos
        </span>
      </div>

      {/* Date context */}
      {dateContext && (
        <div style={{ marginBottom: Space.xl }}>
          <p style={{ fontSize: FontSize.Heading3, fontWeight: FontWeight.Heavy,
            color: dateContext.daysAhead > 0 ? Accent : Text.Primary, lineHeight:1 }}>
            {dateContext.relativeLabel}
          </p>
          <p style={{ fontSize: FontSize.Caption, color: Text.Secondary, marginTop:2 }}>
            {dateContext.weekday}, {dateContext.dayMonth}
          </p>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex:1 }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => onSelect(item.id)}
            aria-current={active === item.id ? 'page' : undefined}
            style={{ width:'100%', display:'flex', alignItems:'center', gap: Space.md,
              padding:`10px ${Space.md}px`, marginBottom: Space.xs,
              background: active === item.id ? `${Accent}15` : 'none',
              border:'none', borderRadius: Radius.md, cursor:'pointer', fontFamily:'inherit',
              textAlign:'left', minHeight:42,
              borderLeft: active === item.id ? `3px solid ${Accent}` : '3px solid transparent' }}>
            <span style={{ fontSize:18 }}>{item.icon}</span>
            <span style={{ fontSize: FontSize.Body,
              color: active === item.id ? Accent : Text.Secondary,
              fontWeight: active === item.id ? FontWeight.Bold : FontWeight.Regular }}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Profile chip */}
      <div style={{ background: Surface.Card, borderRadius: Radius.lg, padding:`${Space.sm}px ${Space.md}px` }}>
        <p style={{ fontSize: FontSize.Caption, fontWeight: FontWeight.Bold,
          color: Text.Primary, marginBottom:2 }}>
          {primaryUser?.name || 'Demo Mode'}
        </p>
        <div style={{ display:'flex', alignItems:'center', gap: Space.xs }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background: statusColor, flexShrink:0 }} />
          <p style={{ fontSize: FontSize.Badge, color: statusColor }}>
            {profileStatus === 'personalised' ? 'Personalised'
              : profileStatus === 'basic'      ? 'Partially set up'
              : profileStatus === 'incomplete' ? 'Incomplete'
              : 'Demo mode'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Right panel ──────────────────────────────────────────────────────────────
function RightPanel({ bs, activeTab, loading }) {
  const panelStyle = {
    width:340, flexShrink:0, position:'sticky', top:0, height:'100vh',
    overflowY:'auto', borderLeft:`1px solid ${Surface.Line}`,
    padding:`${Space['3xl']}px ${Space.xl}px`, background: Surface.Base
  }

  if (activeTab === TABS.PLANNER) return (
    <div style={panelStyle}>
      <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold,
        color: Text.Primary, marginBottom: Space.xl }}>Planner</p>
      <p style={{ fontSize: FontSize.Caption, color: Text.Secondary, marginBottom: Space.xl }}>
        {bs.dateContext?.weekLabel}
      </p>
      {loading ? <SkeletonCard lines={3} /> : <>
        <ThisWeekSection weeklyPlan={bs.weeklyPlan} onFetchFuture={bs.handleFetchFuture} />
        <UpcomingSection opportunities={bs.opportunities} weeklyPlan={bs.weeklyPlan}
          onFetchFuture={bs.handleFetchFuture} />
      </>}
    </div>
  )

  if (activeTab === TABS.FAMILY) return (
    <div style={panelStyle}>
      <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold,
        color: Text.Primary, marginBottom: Space.xs }}>Family</p>
      <p style={{ fontSize: FontSize.Caption, color: Text.Secondary, marginBottom: Space.xl }}>
        {bs.dateContext?.weekday}, {bs.dateContext?.dayMonth}
      </p>
      {loading ? <SkeletonCard lines={3} /> :
        <FamilyBriefSection brief={bs.brief} daily={bs.daily}
          onFamilyPlan={() => bs.handleTabChange(TABS.FAMILY)} />}
    </div>
  )

  // Default: timeline + tomorrow
  return (
    <div style={panelStyle}>
      <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold,
        color: Text.Primary, marginBottom: Space.xl }}>Today's Timeline</p>
      {loading ? <SkeletonCard lines={4} /> : <>
        <TimelineSection timeline={bs.timeline} />
        <TomorrowSection brief={bs.brief} onFetchFuture={bs.handleFetchFuture} />
      </>}
    </div>
  )
}

// ─── Main column content by tab ───────────────────────────────────────────────
function MainContent({ bs, loading, activeTab, onNav }) {
  const mainStyle = {
    flex:1, minWidth:0, maxWidth:680,
    padding:`${Space['3xl']}px ${Space['3xl']}px ${Space['3xl']}px ${Space['2xl']}px`,
    overflowY:'auto', height:'100vh'
  }

  // Planner and Family use the right panel; main shows brief + recommendations for context
  const isSecondaryTab = activeTab === TABS.PLANNER || activeTab === TABS.FAMILY

  if (loading) return (
    <div style={mainStyle}>
      <SkeletonHero />
      <SkeletonCard lines={3} />
      <SkeletonCard lines={2} />
    </div>
  )

  return (
    <div style={mainStyle}>
      {import.meta.env.DEV && <DiagnosticsPanel diagnostics={bs.diagnostics} />}

      {/* Context (no DemoBanner on desktop — profile chip in sidebar covers this) */}
      {bs.dateContext?.daysAhead > 0 && (
        <DateHeader dateContext={bs.dateContext} primaryUser={bs.primaryUser}
          profileStatus={bs.profileStatus} onReturnToday={bs.handleReturnToday} />
      )}

      {/* Always show brief + priorities */}
      <MorningBriefSection brief={bs.brief} primaryUser={bs.primaryUser} />
      <RecommendationSection packages={bs.recommendationPackages} onFeedback={bs.handleFeedback} />

      {/* On Today tab, also show upcoming in main column */}
      {!isSecondaryTab && (
        <>
          <div style={{ height:1, background: Surface.Line, margin:`${Space.xl}px 0` }} />
          <UpcomingSection opportunities={bs.opportunities} weeklyPlan={bs.weeklyPlan}
            onFetchFuture={bs.handleFetchFuture} />
          <ThisWeekSection weeklyPlan={bs.weeklyPlan} onFetchFuture={bs.handleFetchFuture} />
        </>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DesktopShell({ bs, loading }) {
  const activeTab = bs.tab

  function handleNav(tab) {
    if (tab === TABS.MORE)    { bs.openProfile();  return }
    if (tab === TABS.JOURNAL) { bs.openInsights(); return }
    bs.handleTabChange(tab)
    // On desktop, nothing is "opened" — the right panel changes
    bs.closePlanner()
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background: Surface.Background,
      maxWidth:1600, margin:'0 auto' }}>
      <SideNav active={activeTab} onSelect={handleNav}
        profileStatus={bs.profileStatus} primaryUser={bs.primaryUser}
        dateContext={bs.dateContext} />

      <MainContent bs={bs} loading={loading} activeTab={activeTab} onNav={handleNav} />

      <RightPanel bs={bs} activeTab={activeTab} loading={loading} />

      {bs.profileOpen  && <ProfileModal  onClose={bs.closeProfile}  identity={bs.identity} onSave={bs.handleSaveProfile} onExport={bs.handleExport} onImport={bs.handleImport} onDelete={bs.handleDeleteProfile} />}
      {bs.inviteOpen   && <InviteModal   onClose={bs.closeInvite} />}
      {bs.insightsOpen && <InsightsModal onClose={bs.closeInsights} identity={bs.identity} />}
    </div>
  )
}
