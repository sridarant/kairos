import { useState } from 'react'

const ACTIVITIES = [
  { id:'outing',    label:'Family Outing',          icon:'🏞️' },
  { id:'travel',    label:'Travel',                  icon:'✈️' },
  { id:'temple',    label:'Temple Visit',            icon:'🛕' },
  { id:'finance',   label:'Financial Discussion',    icon:'💰' },
  { id:'shopping',  label:'Shopping',               icon:'🛍️' },
  { id:'medical',   label:'Medical Appointment',     icon:'🏥' },
  { id:'celebrate', label:'Celebration / Function', icon:'🎉' },
]

function Stars({ count }) {
  return <span style={{ fontSize:14 }}>{Array.from({length:5},(_,i)=><span key={i} style={{opacity:i<count?1:0.2}}>★</span>)}</span>
}

export default function FamilyPlanModal({ onClose, users, daily }) {
  const [selected, setSelected] = useState(null)
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)

  async function handleSelect(act) {
    setSelected(act)
    setLoading(true)
    // Compute best day from week_plan + family alignment
    await new Promise(r => setTimeout(r, 600))
    const plan = daily?.week_plan || []
    const best = plan.sort((a,b) => b.stars - a.stars)[0]
    const alignment = daily?.family_alignment
    const conf = Math.round(((best?.stars || 3) / 5) * 90)
    setResult({
      activity: act.label,
      best_day: best?.label || 'Tomorrow',
      best_time: alignment?.best_shared_window || daily?.golden_window || '10:00–12:00',
      stars: best?.stars || 3,
      confidence: conf,
      reason: `${alignment ? `Family harmony is ${alignment.harmony_pct}%.` : ''} ${best?.summary || 'Conditions are favourable.'} ${act.id === 'travel' ? 'Avoid evening departures.' : act.id === 'temple' ? 'Morning hours carry spiritual clarity.' : ''}`.trim()
    })
    setLoading(false)
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', zIndex:40 }} />
      <div className="slide-up" style={{
        position:'fixed', left:0, right:0, bottom:0, maxWidth:448, margin:'0 auto',
        maxHeight:'90vh', overflowY:'auto', background:'var(--gray-1)',
        borderRadius:'20px 20px 0 0', zIndex:50
      }}>
        <div style={{ padding:'24px 16px 100px' }}>
          <div style={{ width:36, height:4, background:'var(--gray-3)', borderRadius:2, margin:'0 auto 20px' }} />
          <h2 style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>Family Planning</h2>
          <p style={{ fontSize:13, color:'var(--gray-4)', marginBottom:20 }}>
            {users.length > 1 ? `Planning for ${users.map(u=>u.name).join(', ')}` : 'Add family members to plan together'}
          </p>

          {!result ? (
            <>
              <p style={{ fontSize:12, color:'var(--gray-4)', marginBottom:10 }}>What are you planning?</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {ACTIVITIES.map(a => (
                  <button key={a.id} onClick={() => handleSelect(a)} disabled={loading} style={{
                    background: selected?.id === a.id ? 'rgba(250,204,21,0.15)' : 'var(--gray-2)',
                    border: selected?.id === a.id ? '1px solid var(--yellow)' : '1px solid transparent',
                    borderRadius:12, padding:'14px 12px', cursor:'pointer', fontFamily:'inherit',
                    display:'flex', flexDirection:'column', alignItems:'center', gap:6
                  }}>
                    <span style={{ fontSize:24 }}>{a.icon}</span>
                    <span style={{ fontSize:12, color:'var(--gray-4)', textAlign:'center', lineHeight:1.3 }}>{a.label}</span>
                  </button>
                ))}
              </div>
              {loading && <div style={{ textAlign:'center', marginTop:20 }}><span className="spinner" /></div>}
            </>
          ) : (
            <div className="fade-in">
              <div style={{ background:'var(--gray-2)', borderRadius:12, padding:16, marginBottom:12 }}>
                <p style={{ fontSize:12, color:'var(--yellow)', fontWeight:700, marginBottom:8 }}>{result.activity}</p>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <div>
                    <p style={{ fontSize:11, color:'var(--gray-4)' }}>Best Day</p>
                    <p style={{ fontSize:16, fontWeight:700 }}>{result.best_day}</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:11, color:'var(--gray-4)' }}>Best Time</p>
                    <p style={{ fontSize:16, fontWeight:700 }}>{result.best_time}</p>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <Stars count={result.stars} />
                  <span style={{ fontSize:12, color:'var(--gray-4)' }}>Confidence: {result.confidence}%</span>
                </div>
                <p style={{ fontSize:12, color:'var(--gray-4)', lineHeight:1.5 }}>{result.reason}</p>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => { setResult(null); setSelected(null) }} style={{
                  flex:1, padding:14, background:'var(--gray-2)', border:'none', borderRadius:12,
                  color:'#fff', fontSize:14, cursor:'pointer', fontFamily:'inherit'
                }}>Plan Another</button>
                <button onClick={onClose} style={{
                  flex:1, padding:14, background:'var(--yellow)', border:'none', borderRadius:12,
                  color:'#000', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit'
                }}>Done</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
