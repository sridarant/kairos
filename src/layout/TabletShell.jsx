/**
 * TabletShell — two-column layout for 768–1199px.
 *
 * Left column (fixed sidebar): navigation + profile status + quick context
 * Right column (scrollable):   full home content
 *
 * No bottom nav on tablet — sidebar nav replaces it.
 * Planner and Family open as inline right-side panels (not modals).
 */
import { useState } from 'react'
import Logo from '../components/Logo.jsx'
import HomeScreen    from '../components/HomeScreen.jsx'
import PlannerScreen from '../components/PlannerScreen.jsx'
import FamilyScreen  from '../components/FamilyScreen.jsx'
import ProfileModal  from '../components/ProfileModal.jsx'
import InviteModal   from '../components/InviteModal.jsx'
import InsightsModal from '../components/InsightsModal.jsx'
import { Surface, Text, Accent, Radius, Space, FontSize, FontWeight, Z } from '../styles/tokens/index.js'
import { PROFILE_STATUS_COLOR } from '../app/config/userProfile.js'
import { TABS } from '../constants/index.js'

const NAV_ITEMS = [
  { id: TABS.TODAY,   icon:'🏠', label:'Today'   },
  { id: TABS.PLANNER, icon:'📅', label:'Planner' },
  { id: TABS.FAMILY,  icon:'👨‍👩‍👧', label:'Family'  },
  { id: TABS.JOURNAL, icon:'📖', label:'Journal' },
  { id: TABS.MORE,    icon:'⚙️',  label:'Settings'},
]

function SideNav({ active, onSelect, profileStatus, primaryUser }) {
  const statusColor = PROFILE_STATUS_COLOR[profileStatus] || '#666'
  return (
    <div style={{ width:200, flexShrink:0, position:'sticky', top:0, height:'100vh',
      display:'flex', flexDirection:'column', padding:`${Space['3xl']}px ${Space.xl}px`,
      borderRight:`1px solid ${Surface.Line}`, background: Surface.Base }}>
      {/* Brand */}
      <div style={{ display:'flex', alignItems:'center', gap: Space.sm, marginBottom: Space['3xl'] }}>
        <Logo />
        <span style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold, color: Text.Primary }}>
          Kairos
        </span>
      </div>

      {/* Profile chip */}
      <div style={{ background: Surface.Card, borderRadius: Radius.lg, padding:`${Space.sm}px ${Space.md}px`,
        marginBottom: Space['2xl'] }}>
        <p style={{ fontSize: FontSize.Caption, color: Text.Secondary, marginBottom:2 }}>
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

      {/* Nav items */}
      <nav style={{ flex:1 }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => onSelect(item.id)}
            aria-current={active === item.id ? 'page' : undefined}
            style={{ width:'100%', display:'flex', alignItems:'center', gap: Space.md,
              padding:`${Space.sm}px ${Space.md}px`, marginBottom: Space.xs,
              background: active === item.id ? `${Accent}18` : 'none',
              border:'none', borderRadius: Radius.md, cursor:'pointer', fontFamily:'inherit',
              textAlign:'left', minHeight:40,
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

      {/* Footer */}
      <p style={{ fontSize: FontSize.Badge, color: Surface.Line, textTransform:'uppercase',
        letterSpacing:'0.07em' }}>
        Life Planning
      </p>
    </div>
  )
}

export default function TabletShell({ bs, loading }) {
  const activeTab = bs.tab

  function handleNav(tab) {
    if (tab === TABS.MORE) { bs.openProfile(); return }
    if (tab === TABS.JOURNAL) { bs.openInsights(); return }
    bs.handleTabChange(tab)
    // For planner/family, open the panel inline — no modal needed
    if (tab === TABS.PLANNER || tab === TABS.FAMILY) bs.openPlanner()
    else bs.closePlanner()
  }

  const showPlanner = activeTab === TABS.PLANNER && bs.plannerOpen
  const showFamily  = activeTab === TABS.FAMILY  && bs.plannerOpen

  return (
    <div style={{ display:'flex', minHeight:'100vh', background: Surface.Background }}>
      <SideNav active={activeTab} onSelect={handleNav}
        profileStatus={bs.profileStatus} primaryUser={bs.primaryUser} />

      {/* Main content area */}
      <div style={{ flex:1, overflowY:'auto', minWidth:0 }}>
        {(showPlanner || showFamily) ? (
          // Inline panel view for tablet
          <div style={{ maxWidth:680, margin:'0 auto', padding:`${Space['3xl']}px ${Space.xl}px` }}>
            {showPlanner ? (
              <PlannerScreen weeklyPlan={bs.weeklyPlan} opportunities={bs.opportunities}
                daily={bs.daily} dateContext={bs.dateContext}
                inline
                onFetchFuture={(d) => { bs.handleTabChange(TABS.TODAY); bs.handleFetchFuture(d) }}
                onClose={() => { bs.handleTabChange(TABS.TODAY); bs.closePlanner() }} />
            ) : (
              <FamilyScreen brief={bs.brief} daily={bs.daily} weeklyPlan={bs.weeklyPlan}
                dateContext={bs.dateContext}
                inline
                onFetchFuture={(d) => { bs.handleTabChange(TABS.TODAY); bs.handleFetchFuture(d) }}
                onClose={() => { bs.handleTabChange(TABS.TODAY); bs.closePlanner() }} />
            )}
          </div>
        ) : (
          <div style={{ maxWidth:680, margin:'0 auto' }}>
            <HomeScreen {...homeProps(bs, loading)} />
          </div>
        )}
      </div>

      {bs.profileOpen  && <ProfileModal  onClose={bs.closeProfile}  identity={bs.identity} onSave={bs.handleSaveProfile} onExport={bs.handleExport} onImport={bs.handleImport} onDelete={bs.handleDeleteProfile} />}
      {bs.inviteOpen   && <InviteModal   onClose={bs.closeInvite} />}
      {bs.insightsOpen && <InsightsModal onClose={bs.closeInsights} identity={bs.identity} onAddEntry={bs.handleAddJournalEntry} />}
    </div>
  )
}

function homeProps(bs, loading) {
  return {
    brief: bs.brief, recommendationPackages: bs.recommendationPackages,
    timeline: bs.timeline, weeklyPlan: bs.weeklyPlan,
    opportunities: bs.opportunities, diagnostics: bs.diagnostics,
    daily: bs.daily, loading, status: bs.status,
    primaryUser: bs.primaryUser, profileStatus: bs.profileStatus,
    dateContext: bs.dateContext,
    onProfileOpen: bs.openProfile, onInvite: bs.openInvite,
    onFamilyPlan: () => { bs.openPlanner(); bs.handleTabChange(TABS.FAMILY) },
    onFetchFuture: bs.handleFetchFuture, onReturnToday: bs.handleReturnToday,
    onFeedback: bs.handleFeedback,
  }
}
