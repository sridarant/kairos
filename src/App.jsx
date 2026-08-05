/**
 * App.jsx v29.0
 *
 * Shell only. All state management delegated to useBootstrap().
 * This file should never exceed ~60 lines.
 */

import { useBootstrap } from './hooks/useBootstrap.js'
import HomeScreen    from './components/HomeScreen'
import PlannerScreen from './components/PlannerScreen'
import ProfileModal  from './components/ProfileModal'
import InviteModal   from './components/InviteModal'
import InsightsModal from './components/InsightsModal'
import BottomNav     from './components/BottomNav'
import { ASYNC_STATE } from './constants/index.js'

export default function App() {
  const bs = useBootstrap()
  const loading = bs.status === ASYNC_STATE.LOADING

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
        userData={bs.userData}
        onProfileOpen={bs.openProfile}
        onInvite={bs.openInvite}
        onFamilyPlan={() => { bs.openPlanner(); bs.handleTabChange('family') }}
        onFetchFuture={bs.handleFetchFuture}
        onFeedback={bs.handleFeedback}
      />

      <BottomNav
        active={bs.tab}
        onToday={() => bs.handleTabChange('today')}
        onPlanner={() => bs.handleTabChange('planner')}
        onFamily={() => bs.handleTabChange('family')}
        onJournal={() => bs.handleTabChange('journal')}
        onMore={bs.openProfile}
      />

      {bs.profileOpen  && <ProfileModal  onClose={bs.closeProfile} users={bs.users} onSave={bs.handleSaveUsers} />}
      {bs.inviteOpen   && <InviteModal   onClose={bs.closeInvite} />}
      {bs.insightsOpen && <InsightsModal onClose={bs.closeInsights} userData={bs.userData} />}
      {bs.plannerOpen  && (
        <PlannerScreen
          weeklyPlan={bs.weeklyPlan}
          opportunities={bs.opportunities}
          daily={bs.daily}
          onFetchFuture={(days) => { bs.closePlanner(); bs.handleFetchFuture(days) }}
          onClose={bs.closePlanner}
        />
      )}
    </div>
  )
}
