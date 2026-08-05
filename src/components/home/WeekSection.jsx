const CC = { High:'var(--green-txt)', Medium:'var(--amber-txt)', Low:'var(--red-txt)' }
const conf = s => (s||50) >= 70 ? 'High' : (s||50) >= 45 ? 'Medium' : 'Low'

export default function WeekSection({ weekPlan, onFetchFuture }) {
  if (!weekPlan?.length) return null
  return (
    <div style={{ marginBottom:16 }}>
      <p style={{ fontSize:12, color:'var(--gray-4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Next 7 Days</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
        {weekPlan.map((d, i) => {
          const c = conf(d.confidence)
          return (
            <div key={i} onClick={() => d.days_ahead > 0 && onFetchFuture?.(d.days_ahead)}
              style={{ background:'var(--gray-2)', borderRadius:12, padding:'10px 12px',
                cursor: d.days_ahead > 0 ? 'pointer' : 'default',
                border: i===0 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
              <p style={{ fontSize:11, color: i===0?'var(--yellow)':'var(--gray-4)', marginBottom:2, fontWeight:i===0?700:400 }}>{d.label}</p>
              <p style={{ fontSize:12, color:CC[c], fontWeight:600, marginBottom:2 }}>{c}</p>
              <p style={{ fontSize:10, color:'var(--gray-4)', lineHeight:1.3 }}>{d.summary}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
