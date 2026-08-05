import { useState, useEffect } from 'react'
import { minsUntilWindow } from '../../lib/dataClient'

const OUTLOOK_STYLE = {
  Positive:    { bg:'var(--green-bg)',  color:'var(--green-txt)',  label:'Positive' },
  Neutral:     { bg:'var(--gray-2)',    color:'var(--gray-4)',     label:'Neutral'  },
  Challenging: { bg:'var(--red-bg)',    color:'var(--red-txt)',    label:'Challenging' }
}
const TRUST = {
  'Very High': { icon:'🟢', label:'Strong Agreement',    color:'var(--green-txt)' },
  High:        { icon:'🟢', label:'Strong Agreement',    color:'var(--green-txt)' },
  Medium:      { icon:'🟡', label:'Moderate Agreement',  color:'var(--amber-txt)' },
  Low:         { icon:'🔴', label:'Conflicting Signals', color:'var(--red-txt)'   }
}

export default function MorningBrief({ brief, onFetchFuture }) {
  const [expanded, setExpanded] = useState(false)
  const [mins, setMins] = useState(() => minsUntilWindow(brief?.bestWindow))

  useEffect(() => {
    const t = setInterval(() => setMins(minsUntilWindow(brief?.bestWindow)), 60000)
    return () => clearInterval(t)
  }, [brief?.bestWindow])

  if (!brief) return null
  const outlook = OUTLOOK_STYLE[brief.outlook] || OUTLOOK_STYLE.Neutral
  const t = (TRUST[brief.confidence] || TRUST.Medium)

  return (
    <div style={{ background:'var(--gray-2)', borderRadius:16, padding:'16px', marginBottom:14 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
        <div>
          <p style={{ fontSize:11, color:'var(--gray-4)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:2 }}>Today's Theme</p>
          <h2 style={{ fontSize:22, fontWeight:800, lineHeight:1.1, marginBottom:0 }}>{brief.theme}</h2>
        </div>
        <div style={{ textAlign:'right', flexShrink:0, marginLeft:8 }}>
          <div style={{ display:'inline-flex', background:outlook.bg, borderRadius:20, padding:'3px 9px', marginBottom:3 }}>
            <span style={{ fontSize:11, color:outlook.color, fontWeight:700 }}>{outlook.label}</span>
          </div>
          <p style={{ fontSize:10, color:t.color }}>{t.icon} {t.label}</p>
        </div>
      </div>

      {/* Best Window */}
      <div style={{ background:'var(--yellow)', borderRadius:12, padding:'10px 14px', marginBottom:10, color:'#000' }}>
        <p style={{ fontSize:10, fontWeight:600, opacity:0.6, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:1 }}>
          Best Window{mins ? ` · ${mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h ${mins%60}m`} away` : ''}
        </p>
        <p style={{ fontSize:22, fontWeight:800 }}>{brief.bestWindow}</p>
      </div>

      {brief.decisionOfDay && (
        <div style={{ marginBottom:8 }}>
          <p style={{ fontSize:10, color:'var(--gray-4)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>Priority Today</p>
          <p style={{ fontSize:13, color:'var(--white)', lineHeight:1.5 }}>{brief.decisionOfDay}</p>
        </div>
      )}

      {brief.watchFor && (
        <div style={{ marginBottom: expanded ? 10 : 0 }}>
          <p style={{ fontSize:10, color:'var(--amber-txt)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>Watch For</p>
          <p style={{ fontSize:12, color:'var(--gray-4)', lineHeight:1.4 }}>{brief.watchFor}</p>
        </div>
      )}

      {expanded && (
        <div className="fade-in" style={{ marginTop:10 }}>
          {brief.opportunities?.length > 0 && (
            <div style={{ marginBottom:10 }}>
              <p style={{ fontSize:10, color:'var(--green-txt)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Opportunities</p>
              {brief.opportunities.map((o, i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:15, flexShrink:0 }}>{o.icon}</span>
                  <div>
                    <p style={{ fontSize:12, fontWeight:600, color:'var(--white)', marginBottom:1 }}>{o.label}</p>
                    <p style={{ fontSize:11, color:'var(--gray-4)', lineHeight:1.4 }}>{o.advice}</p>
                    {o.bestTime && <p style={{ fontSize:10, color:'var(--yellow)', marginTop:1 }}>{o.bestTime}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {brief.cautions?.length > 0 && (
            <div style={{ marginBottom:10 }}>
              <p style={{ fontSize:10, color:'var(--red-txt)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Cautions</p>
              {brief.cautions.map((c, i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:15, flexShrink:0 }}>{c.icon}</span>
                  <div>
                    <p style={{ fontSize:12, fontWeight:600, color:'var(--white)', marginBottom:1 }}>{c.label}</p>
                    <p style={{ fontSize:11, color:'var(--gray-4)', lineHeight:1.4 }}>{c.advice}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {brief.familyBrief && (
            <div style={{ background:'var(--gray-1)', borderRadius:10, padding:'10px 12px' }}>
              <p style={{ fontSize:10, color:'var(--gray-4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Family</p>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ fontSize:12, color:'var(--white)' }}>Energy</span>
                <span style={{ fontSize:12, fontWeight:600, color: brief.familyBrief.energy === 'High' ? 'var(--green-txt)' : 'var(--amber-txt)' }}>{brief.familyBrief.energy}</span>
              </div>
              {brief.familyBrief.bestWindow && (
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:12, color:'var(--gray-4)' }}>Best together</span>
                  <span style={{ fontSize:12, color:'var(--yellow)', fontWeight:600 }}>{brief.familyBrief.bestWindow}</span>
                </div>
              )}
              {brief.familyBrief.activities?.length > 0 && (
                <p style={{ fontSize:11, color:'var(--gray-4)' }}>✓ {brief.familyBrief.activities.slice(0,3).join(' · ')}</p>
              )}
            </div>
          )}
        </div>
      )}

      <button onClick={() => setExpanded(v => !v)} style={{ width:'100%', background:'none', border:'none',
        color:'var(--gray-4)', fontSize:12, cursor:'pointer', fontFamily:'inherit', padding:'8px 0 0', textAlign:'center', minHeight:32 }}
        aria-label={expanded ? 'Collapse brief' : 'Expand full brief'}>
        {expanded ? '▴ Less' : '▾ Full brief'}
      </button>
    </div>
  )
}
