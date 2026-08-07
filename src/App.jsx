/**
 * App.jsx v30.3 — Shell only.
 * Identity is loaded by useBootstrap via IdentityManager before render.
 */
import { useBootstrap } from './hooks/useBootstrap.js'
import AppShell         from './layout/AppShell.jsx'
import OnboardingModal  from './components/OnboardingModal.jsx'
import { ASYNC_STATE }  from './constants/index.js'
import { Surface, Text, Status, Accent, FontSize, FontWeight, Space, Radius, Z } from './styles/tokens/index.js'

function SaveToast({ message }) {
  if (!message) return null
  return (
    <div style={{ position:'fixed', bottom:96, left:'50%', transform:'translateX(-50%)',
      background: Surface.Card, border:`1px solid ${Accent}55`, borderRadius: Radius.pill,
      padding:`${Space.sm}px ${Space.xl}px`, fontSize: FontSize.Caption, color: Accent,
      fontWeight: FontWeight.Bold, zIndex: Z.modal, pointerEvents:'none',
      whiteSpace:'nowrap', boxShadow:'0 4px 24px rgba(0,0,0,0.4)' }}>
      {message}
    </div>
  )
}

export default function App() {
  const bs = useBootstrap()
  const loading = bs.status === ASYNC_STATE.LOADING

  return (
    <>
      <AppShell bs={bs} loading={loading} />
      {bs.onboardOpen && (
        <OnboardingModal
          onComplete={bs.handleOnboardComplete}
          onSkip={() => { bs.closeOnboard(); }} />
      )}
      <SaveToast message={bs.saveMessage} />
    </>
  )
}
