const TRUST = { High:{icon:'🟢',color:'var(--green-txt)'}, Medium:{icon:'🟡',color:'var(--amber-txt)'}, Low:{icon:'🔴',color:'var(--red-txt)'} }
const STARS = (n) => Array.from({length:5},(_,i) => <span key={i} style={{opacity:i<n?1:0.2}}>★</span>)

export default function TomorrowPreview({ preview, onFetchFuture }) {
  if (!preview) return null
  const t = TRUST[preview.confidence] || TRUST.Medium
  return (
    <div onClick={() => onFetchFuture?.(1)} role="button" aria-label="View tomorrow"
      style={{ background:'var(--gray-2)', borderRadius:12, padding:'11px 14px', marginBottom:12,
        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div>
        <p style={{ fontSize:10, color:'var(--gray-4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>Tomorrow</p>
        <p style={{ fontSize:13, color:'var(--white)', lineHeight:1.4 }}>{preview.summary}</p>
      </div>
      <div style={{ textAlign:'right', flexShrink:0, marginLeft:10 }}>
        <div style={{ fontSize:12, color:t.color, marginBottom:2 }}>{STARS(preview.stars)}</div>
        <p style={{ fontSize:10, color:t.color }}>{t.icon} {t.label || preview.confidence}</p>
      </div>
    </div>
  )
}
