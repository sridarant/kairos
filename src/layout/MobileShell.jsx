/**
 * MobileShell — unchanged mobile experience.
 * Narrow single-column, bottom navigation, modal overlays.
 */
import HomeScreen    from '../components/HomeScreen.jsx'
import PlannerScreen from '../components/PlannerScreen.jsx'
import FamilyScreen  from '../components/FamilyScreen.jsx'
import ProfileModal  from '../components/ProfileModal.jsx'
import InviteModal   from '../components/InviteModal.jsx'
import InsightsModal from '../components/InsightsModal.jsx'
import BottomNav     from '../components/BottomNav.jsx'
import { TABS }      from '../constants/index.js'

export default function MobileShell({ bs, loading }) {
  return (
    <div style={{ maxWidth:448, margin:'0 auto', minHeight:'100dvh',
      position:'relative', paddingBottom:76 }}>
      <HomeScreen {...homeProps(bs, loading)} />
      <BottomNav
        active={bs.tab}
        onToday={()   => { bs.handleTabChange(TABS.TODAY); bs.handleReturnToday() }}
        onPlanner={()  => bs.handleTabChange(TABS.PLANNER)}
        onFamily={()   => bs.handleTabChange(TABS.FAMILY)}
        onJournal={()  => bs.handleTabChange(TABS.JOURNAL)}
        onMore={bs.openProfile}
      />
      {bs.profileOpen  && <ProfileModal  onClose={bs.closeProfile}  identity={bs.identity} onSave={bs.handleSaveProfile} onExport={bs.handleExport} onImport={bs.handleImport} onDelete={bs.handleDeleteProfile} />}
      {bs.inviteOpen   && <InviteModal   onClose={bs.closeInvite} />}
      {bs.insightsOpen && <InsightsModal onClose={bs.closeInsights} identity={bs.identity} />}
      {bs.plannerOpen && bs.tab === TABS.PLANNER && (
        <PlannerScreen weeklyPlan={bs.weeklyPlan} opportunities={bs.opportunities}
          daily={bs.daily} dateContext={bs.dateContext}
          onFetchFuture={(d) => { bs.closePlanner(); bs.handleFetchFuture(d) }}
          onClose={bs.closePlanner} />
      )}
      {bs.plannerOpen && bs.tab === TABS.FAMILY && (
        <FamilyScreen brief={bs.brief} daily={bs.daily} weeklyPlan={bs.weeklyPlan}
          dateContext={bs.dateContext}
          onFetchFuture={(d) => { bs.closePlanner(); bs.handleFetchFuture(d) }}
          onClose={bs.closePlanner} />
      )}
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
