/**
 * MobileShell v30.8 — light, primary-route based.
 * Bottom nav is minimal: text labels, no emoji.
 */
import { ASYNC_STATE, TABS } from '../constants/index.js'
import { Surface, Text, Accent } from '../styles/tokens/index.js'
import { Space, FontSize, FontWeight, Z } from '../styles/tokens/index.js'
import HomeScreen     from '../components/HomeScreen.jsx'
import PlannerScreen  from '../components/PlannerScreen.jsx'
import FamilyScreen   from '../components/FamilyScreen.jsx'
import InsightsScreen from '../components/InsightsScreen.jsx'
import SettingsScreen  from '../components/SettingsScreen.jsx'
import InviteModal    from '../components/InviteModal.jsx'
import OnboardingModal from '../components/OnboardingModal.jsx'

const NAV = [
  { id:TABS.TODAY,   label:'Today'    },
  { id:TABS.PLANNER, label:'Planner'  },
  { id:TABS.FAMILY,  label:'Family'   },
  { id:TABS.JOURNAL, label:'Insights' },
  { id:TABS.SETTINGS,    label:'Settings' },
]

function BottomNav({ active, onSelect }) {
  return (
    <nav aria-label="Main navigation" style={{
      position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
      width:'100%', maxWidth:448,
      background:Surface.Base, borderTop:`1px solid ${Surface.Line}`,
      paddingBottom:`calc(${Space.sm}px + env(safe-area-inset-bottom,0px))`,
      display:'flex', zIndex:Z.nav }}>
      {NAV.map(t => (
        <button key={t.id} onClick={() => onSelect(t.id)}
          aria-current={active===t.id ? 'page' : undefined}
          style={{ flex:1, background:'none', border:'none', cursor:'pointer',
            display:'flex', flexDirection:'column', alignItems:'center',
            padding:`${Space.sm}px 0`, minHeight:48, fontFamily:'inherit' }}>
          <span style={{ fontSize:9, letterSpacing:'0.05em',
            color: active===t.id ? Accent : Text.Secondary,
            fontWeight: active===t.id ? FontWeight.Bold : FontWeight.Regular,
            textTransform:'uppercase' }}>
            {t.label}
          </span>
        </button>
      ))}
    </nav>
  )
}

export default function MobileShell({ bs }) {
  const loading = bs.status === ASYNC_STATE.LOADING
  const tab     = bs.tab

  function onSelect(t) {
    // R2.4A: Settings is a page — setTab directly, no modal
    bs.setTab(t)
    if (t === TABS.TODAY) bs.handleReturnToday()
  }

  return (
    <div style={{ maxWidth:448, margin:'0 auto', minHeight:'100dvh',
      position:'relative', paddingBottom:52, background:Surface.Background }}>

      {tab === TABS.TODAY && (
        <HomeScreen
          brief={bs.brief} recommendationPackages={bs.recommendationPackages}
          timeline={bs.timeline} weeklyPlan={bs.weeklyPlan}
          opportunities={bs.opportunities} daily={bs.daily}
          loading={loading} status={bs.status}
          primaryUser={bs.primaryUser} profileStatus={bs.profileStatus}
          dateContext={bs.dateContext} diagnostics={bs.diagnostics}
          onProfileOpen={() => bs.setTab(TABS.SETTINGS)} onInvite={bs.openInvite}
          onFetchFuture={bs.handleFetchFuture} onReturnToday={bs.handleReturnToday}
          onFeedback={bs.handleFeedback}
          onFamilyPlan={() => bs.setTab(TABS.FAMILY)}
        />
      )}
      {tab === TABS.PLANNER && (
        <PlannerScreen weeklyPlan={bs.weeklyPlan} opportunities={bs.opportunities}
          daily={bs.daily} dateContext={bs.dateContext} allUsers={bs.allUsers}
          onFetchFuture={bs.handleFetchFuture} onReturnToday={bs.handleReturnToday} />
      )}
      {tab === TABS.FAMILY && (
        <FamilyScreen brief={bs.brief} daily={bs.daily} members={bs.members}
          weeklyPlan={bs.weeklyPlan} dateContext={bs.dateContext} identity={bs.identity}
          onFetchFuture={bs.handleFetchFuture} />
      )}
      {tab === TABS.JOURNAL && (
        <InsightsScreen identity={bs.identity} />
      )}
      {tab === TABS.SETTINGS && (
        <SettingsScreen identity={bs.identity}
          onSave={bs.handleSaveProfile} onExport={bs.handleExport}
          onImport={bs.handleImport} onDelete={bs.handleDeleteProfile} />
      )}

      <BottomNav active={tab} onSelect={onSelect} />

      {bs.onboardOpen && (
        <OnboardingModal onComplete={bs.handleOnboardComplete} onSkip={bs.closeOnboard} />
      )}
      {/* ProfileModal removed R2.4A: Settings is a page */}
      {bs.inviteOpen && <InviteModal onClose={bs.closeInvite} />}
    </div>
  )
}
