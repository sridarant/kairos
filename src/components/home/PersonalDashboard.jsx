import { useState } from 'react'
const TRUST = { High:{icon:'🟢',label:'Strong Agreement',color:'var(--green-txt)'}, Medium:{icon:'🟡',label:'Moderate Agreement',color:'var(--amber-txt)'}, Low:{icon:'🔴',label:'Conflicting Signals',color:'var(--red-txt)'} }

function RecCard({ rec, onFeedback }) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(null)
  const t = TRUST[rec.confidence] || TRUST.Medium
  function act(e, val) { e.stopPropagation(); setDone(val); onFeedback?.(rec.category, rec.recommendation, val) }
  return (
    <div style={{ background:'var(--gray-2)', borderRadius:12, padding:'12px 14px', marginBottom:6 }} aria-label={`${rec.title} recommendation`}>
      <div onClick={() => setOpen(o => !o)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:17 }}>{rec.icon}</span>
          <span style={{ fontSize:13, fontWeight:600 }}>{rec.title}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ fontSize:10, color:t.color, fontWeight:600 }}>{t.label}</span>
          <span style={{ fontSize:11, color:'var(--gray-4)' }}>{open?'▴':'▾'}</span>
        </div>
      </div>
      {!open && <p style={{ fontSize:12, color:'var(--gray-4)', marginTop:4, lineHeight:1.4 }}>{rec.summary}</p>}
      {open && (
        <div className="fade-in" style={{ marginTop:10 }}>
          <p style={{ fontSize:11, color:'var(--gray-4)', fontWeight:600, marginBottom:2 }}>What</p>
          <p style={{ fontSize:13, color:'var(--white)', marginBottom:8, lineHeight:1.5 }}>{rec.recommendation}</p>
          <p style={{ fontSize:11, color:'var(--gray-4)', fontWeight:600, marginBottom:2 }}>Why</p>
          <p style={{ fontSize:12, color:'var(--gray-4)', marginBottom:8, lineHeight:1.5 }}>{rec.reasoning}</p>
          {rec.bestWindow && (<>
            <p style={{ fontSize:11, color:'var(--gray-4)', fontWeight:600, marginBottom:2 }}>When</p>
            <p style={{ fontSize:12, color:'var(--yellow)', marginBottom:10 }}>{rec.bestWindow}</p>
          </>)}
          {!done ? (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {[['helpful','✓ Done'],['not_helpful','✗ Skip'],['skipped','Not relevant']].map(([v,l])=>(
                <button key={v} onClick={e=>act(e,v)} style={{ background:'var(--gray-3)', border:'none', borderRadius:8,
                  padding:'6px 10px', fontSize:11, color:'var(--gray-4)', cursor:'pointer', fontFamily:'inherit', fontWeight:600, minHeight:32 }}>{l}</button>
              ))}
            </div>
          ) : <p style={{ fontSize:11, color:'var(--gray-4)' }}>✓ Recorded — thank you.</p>}
        </div>
      )}
    </div>
  )
}

export default function PersonalDashboard({ packages, onFeedback }) {
  const [showAll, setShowAll] = useState(false)
  if (!packages?.length) return null
  const top = packages.slice(0, 5), rest = packages.slice(5)
  return (
    <div style={{ marginBottom:16 }}>
      <p style={{ fontSize:12, color:'var(--gray-4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Today's Guidance</p>
      {top.map((r, i) => <RecCard key={r.id || i} rec={r} onFeedback={onFeedback} />)}
      {rest.length > 0 && (<>
        {showAll && rest.map((r, i) => <RecCard key={r.id || `r${i}`} rec={r} onFeedback={onFeedback} />)}
        <button onClick={() => setShowAll(v => !v)} style={{ width:'100%', background:'none', border:'1px solid var(--gray-3)',
          borderRadius:10, color:'var(--gray-4)', fontSize:12, padding:'10px', cursor:'pointer', fontFamily:'inherit', marginTop:4, minHeight:40 }}>
          {showAll ? '▴ Show less' : `▾ ${rest.length} more areas`}
        </button>
      </>)}
    </div>
  )
}
