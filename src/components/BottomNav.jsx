export default function BottomNav({ onHome, onInsights, onProfile }) {
  return (
    <div style={{
      position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
      width:'100%', maxWidth:448,
      background:'rgba(0,0,0,0.9)', backdropFilter:'blur(12px)',
      borderTop:'1px solid var(--gray-2)',
      padding:'10px 16px calc(10px + env(safe-area-inset-bottom, 0px))',
      display:'flex', gap:8, zIndex:30
    }}>
      <button onClick={onHome} style={{
        flex:1, padding:'10px 0', background:'var(--gray-2)', border:'none', borderRadius:12,
        color:'#fff', fontSize:20, cursor:'pointer'
      }}>🏠</button>
      <button onClick={onInsights} style={{
        flex:1, padding:'10px 0', background:'var(--gray-2)', border:'none', borderRadius:12,
        color:'#fff', fontSize:20, cursor:'pointer'
      }}>📊</button>
      <button onClick={onProfile} style={{
        flex:1, padding:'10px 0', background:'var(--gray-2)', border:'none', borderRadius:12,
        color:'#fff', fontSize:20, cursor:'pointer'
      }}>👤</button>
    </div>
  )
}
