/**
 * MobileShell v30.5 — True route-based navigation.
 *
 * Each tab shows a distinct primary screen. HomeScreen is NOT always mounted.
 * Planner and Family are primary routes, not modal overlays.
 */
import { ASYNC_STATE, TABS } from '../constants/index.js'
import HomeScreen     from '../components/HomeScreen.jsx'
import PlannerScreen  from '../components/PlannerScreen.jsx'
import FamilyScreen   from '../components/FamilyScreen.jsx'
import InsightsScreen from '../components/InsightsScreen.jsx'
import ProfileModal   from '../components/ProfileModal.jsx'
import InviteModal    from '../components/InviteModal.jsx'
import BottomNav      from '../components/BottomNav.jsx'

export default function MobileShell({ bs }) {
  const loading = bs.status === ASYNC_STATE.LOADING
  const tab     = bs.tab

  return (
    <div style={{ maxWidth:448, margin:'0 auto', minHeight:'100dvh', position:'relative', paddingBottom:76 }}>

      {/* Primary route — one screen at a time */}
      {tab === TABS.TODAY && (
        <HomeScreen
          brief={bs.brief} recommendationPackages={bs.recommendationPackages}
          timeline={bs.timeline} weeklyPlan={bs.weeklyPlan}
          opportunities={bs.opportunities} daily={bs.daily}
          loading={loading} status={bs.status}
          primaryUser={bs.primaryUser} profileStatus={bs.profileStatus}
          dateContext={bs.dateContext} diagnostics={bs.diagnostics}
          onProfileOpen={bs.openProfile} onInvite={bs.openInvite}
          onFetchFuture={bs.handleFetchFuture} onReturnToday={bs.handleReturnToday}
          onFeedback={bs.handleFeedback}
          onFamilyPlan={() => bs.setTab('family')}
        />
      )}

      {tab === TABS.PLANNER && (
        <PlannerScreen
          weeklyPlan={bs.weeklyPlan} opportunities={bs.opportunities}
          daily={bs.daily} dateContext={bs.dateContext}
          allUsers={bs.allUsers}
          onFetchFuture={bs.handleFetchFuture}
          onReturnToday={bs.handleReturnToday}
        />
      )}

      {tab === TABS.FAMILY && (
        <FamilyScreen
          brief={bs.brief} daily={bs.daily} members={bs.members} weeklyPlan={bs.weeklyPlan}
          dateContext={bs.dateContext} identity={bs.identity}
          onFetchFuture={bs.handleFetchFuture}
        />
      )}

      {tab === TABS.JOURNAL && (
        <InsightsScreen identity={bs.identity} />
      )}

      <BottomNav
        active={tab}
        onToday={()   => { bs.setTab(TABS.TODAY);   bs.handleReturnToday() }}
        onPlanner={()  => bs.setTab(TABS.PLANNER)}
        onFamily={()   => bs.setTab(TABS.FAMILY)}
        onJournal={()  => bs.setTab(TABS.JOURNAL)}
        onMore={bs.openProfile}
      />

      {bs.profileOpen && (
        <ProfileModal onClose={bs.closeProfile} identity={bs.identity}
          onSave={bs.handleSaveProfile} onExport={bs.handleExport}
          onImport={bs.handleImport} onDelete={bs.handleDeleteProfile} />
      )}
      {bs.inviteOpen && <InviteModal onClose={bs.closeInvite} />}
    </div>
  )
}
