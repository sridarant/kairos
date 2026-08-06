/**
 * App.jsx v30.0 — Shell only (~70 lines).
 * State via useBootstrap(). No business logic.
 */
import { useBootstrap } from './hooks/useBootstrap.js'
import HomeScreen    from './components/HomeScreen'
import PlannerScreen from './components/PlannerScreen'
import FamilyScreen  from './components/FamilyScreen'
import ProfileModal  from './components/ProfileModal'
import InviteModal   from './components/InviteModal'
import InsightsModal from './components/InsightsModal'
import BottomNav     from './components/BottomNav'
import { ASYNC_STATE, TABS } from './constants/index.js'

export default function App() {
  const bs = useBootstrap()
  const loading = bs.status === ASYNC_STATE.LOADING

  // Family tab now opens FamilyScreen directly (not Planner)
  const familyOpen = bs.tab === TABS.FAMILY && bs.plannerOpen

  return (
    <div style={{ maxWidth:448, margin:'0 auto', minHeight:'100dvh', position:'relative', paddingBottom:76 }}>
      <HomeScreen
        brief={bs.brief}
        recommendationPackages={bs.recommendationPackages}
        timeline={bs.timeline}
        weeklyPlan={bs.weeklyPlan}
        opportunities={bs.opportunities}
        diagnostics={bs.diagnostics}
        daily={bs.daily}
        loading={loading}
        status={bs.status}
        primaryUser={bs.primaryUser}
        profileStatus={bs.profileStatus}
        dateContext={bs.dateContext}
        onProfileOpen={bs.openProfile}
        onInvite={bs.openInvite}
        onFamilyPlan={() => { bs.openPlanner(); bs.handleTabChange(TABS.FAMILY) }}
        onFetchFuture={bs.handleFetchFuture}
        onReturnToday={bs.handleReturnToday}
        onFeedback={bs.handleFeedback}
      />

      <BottomNav
        active={bs.tab}
        onToday={() => { bs.handleTabChange(TABS.TODAY); bs.handleReturnToday() }}
        onPlanner={() => bs.handleTabChange(TABS.PLANNER)}
        onFamily={() => bs.handleTabChange(TABS.FAMILY)}
        onJournal={() => bs.handleTabChange(TABS.JOURNAL)}
        onMore={bs.openProfile}
      />

      {bs.profileOpen  && <ProfileModal  onClose={bs.closeProfile}  users={bs.users} onSave={bs.handleSaveUsers} />}
      {bs.inviteOpen   && <InviteModal   onClose={bs.closeInvite} />}
      {bs.insightsOpen && <InsightsModal onClose={bs.closeInsights} userData={bs.userData} />}
      {bs.plannerOpen && bs.tab === TABS.PLANNER && (
        <PlannerScreen
          weeklyPlan={bs.weeklyPlan}
          opportunities={bs.opportunities}
          daily={bs.daily}
          dateContext={bs.dateContext}
          onFetchFuture={(days) => { bs.closePlanner(); bs.handleFetchFuture(days) }}
          onClose={bs.closePlanner}
        />
      )}
      {bs.plannerOpen && bs.tab === TABS.FAMILY && (
        <FamilyScreen
          brief={bs.brief}
          daily={bs.daily}
          weeklyPlan={bs.weeklyPlan}
          dateContext={bs.dateContext}
          onFetchFuture={(days) => { bs.closePlanner(); bs.handleFetchFuture(days) }}
          onClose={bs.closePlanner}
        />
      )}
    </div>
  )
}
