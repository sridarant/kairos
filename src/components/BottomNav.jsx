export default function BottomNav({ onHome, onPlanner, onInsights, onProfile }) {
  return (
    <div style={{
      position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
      width:'100%', maxWidth:448,
      background:'rgba(0,0,0,0.9)', backdropFilter:'blur(12px)',
      borderTop:'1px solid var(--gray-2)',
      padding:'10px 16px calc(10px + env(safe-area-inset-bottom,0px))',
      display:'flex', gap:6, zIndex:30
    }}>
      {[
        { icon:'🏠', label:'Home',    fn: onHome },
        { icon:'📅', label:'Planner', fn: onPlanner },
        { icon:'📊', label:'Insights',fn: onInsights },
        { icon:'👤', label:'Profile', fn: onProfile }
      ].map(b => (
        <button key={b.label} onClick={b.fn} aria-label={b.label} style={{
          flex:1, padding:'8px 0', background:'var(--gray-2)', border:'none', borderRadius:10,
          color:'var(--gray-4)', fontSize:18, cursor:'pointer', display:'flex', flexDirection:'column',
          alignItems:'center', gap:2, minHeight:44
        }}>
          <span>{b.icon}</span>
          <span style={{ fontSize:9, letterSpacing:'0.03em' }}>{b.label}</span>
        </button>
      ))}
    </div>
  )
}
