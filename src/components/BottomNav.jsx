import { Surface, Text, Space, FontSize, FontWeight, Z, Opacity } from '../styles/tokens/index.js'

const TABS = [
  { id:'today',   icon:'🏠', label:'Today',    q:'What should I do today?' },
  { id:'planner', icon:'📅', label:'Planner',   q:'When should I plan?' },
  { id:'family',  icon:'👨‍👩‍👧', label:'Family',   q:'How does the family day look?' },
  { id:'journal', icon:'📖', label:'Journal',   q:'What happened?' },
  { id:'more',    icon:'⚙️',  label:'Settings',  q:'Preferences & more' }
]

export default function BottomNav({ active='today', onToday, onPlanner, onFamily, onJournal, onMore }) {
  const handlers = { today:onToday, planner:onPlanner, family:onFamily, journal:onJournal, more:onMore }
  return (
    <nav aria-label="Main navigation" style={{
      position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
      width:'100%', maxWidth:448,
      background:Surface.Overlay, backdropFilter:'blur(16px)',
      borderTop:`1px solid ${Surface.Line}`,
      paddingTop: Space.sm,
      paddingBottom:`calc(${Space.sm}px + env(safe-area-inset-bottom,0px))`,
      display:'flex', zIndex: Z.nav }}>
      {TABS.map(t => (
        <button key={t.id} onClick={handlers[t.id]}
          aria-label={t.q} aria-current={active===t.id ? 'page' : undefined}
          style={{ flex:1, background:'none', border:'none', cursor:'pointer',
            display:'flex', flexDirection:'column', alignItems:'center', gap: Space.xs,
            padding:`${Space.xs}px 0`, minHeight:44,
            opacity: active===t.id ? Opacity.full : Opacity.dim,
            transition:`opacity 200ms ease` }}>
          <span style={{ fontSize: FontSize.Heading2, lineHeight:1 }}>{t.icon}</span>
          <span style={{ fontSize:9, letterSpacing:'0.04em', color: Text.Primary,
            fontFamily:'inherit', fontWeight: active===t.id ? FontWeight.Bold : FontWeight.Regular }}>
            {t.label}
          </span>
        </button>
      ))}
    </nav>
  )
}
