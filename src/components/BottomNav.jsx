export default function BottomNav({ active = 'today', onToday, onPlanner, onFamily, onJournal, onMore }) {
  const tabs = [
    { id:'today',   icon:'🏠', label:'Today',   fn: onToday   },
    { id:'planner', icon:'📅', label:'Planner', fn: onPlanner },
    { id:'family',  icon:'👨‍👩‍👧', label:'Family',  fn: onFamily  },
    { id:'journal', icon:'📖', label:'Journal', fn: onJournal },
    { id:'more',    icon:'⋯',  label:'More',    fn: onMore    }
  ]
  return (
    <nav aria-label="Main navigation" style={{
      position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
      width:'100%', maxWidth:448,
      background:'rgba(0,0,0,0.95)', backdropFilter:'blur(16px)',
      borderTop:'1px solid var(--gray-2)',
      paddingTop:10,
      paddingBottom:'calc(10px + env(safe-area-inset-bottom,0px))',
      display:'flex', zIndex:30
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={t.fn} aria-label={t.label} aria-current={active === t.id ? 'page' : undefined}
          style={{
            flex:1, background:'none', border:'none', cursor:'pointer',
            display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            padding:'4px 0', minHeight:44,
            opacity: active === t.id ? 1 : 0.45,
            transition:'opacity 0.15s'
          }}>
          <span style={{ fontSize:20, lineHeight:1 }}>{t.icon}</span>
          <span style={{ fontSize:9, letterSpacing:'0.04em', color:'#fff', fontFamily:'inherit',
            fontWeight: active === t.id ? 700 : 400 }}>
            {t.label}
          </span>
        </button>
      ))}
    </nav>
  )
}
