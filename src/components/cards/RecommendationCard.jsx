/**
 * RecommendationCard v30.5
 * Signal label derived from actual quality+stars. No indiscriminate "Excellent opportunity".
 */
import { useState } from 'react'
import { ConfidenceBadge } from '../common/index.jsx'
import { Surface, Text, Status, Accent, Space, Radius, FontSize, FontWeight } from '../../styles/tokens/index.js'
import { FEEDBACK } from '../../constants/index.js'

function signalLabel(pkg) {
  const stars = pkg.stars || 3
  const q     = pkg.quality || 'neutral'
  if (q === 'caution' || stars <= 1) return { text:'Be mindful',      color: Status.Danger }
  if (stars >= 5)                    return { text:'Exceptional',      color:Status.Success }
  if (stars >= 4 && q==='supportive')return { text:'Strong opportunity', color:Status.Success }
  if (stars >= 4)                    return { text:'Favourable',       color: Accent }
  if (stars >= 3)                    return { text:'Worth considering', color: Text.Secondary }
  if (q === 'mixed')                 return { text:'Mixed signals',    color:Status.Caution }
  return                               { text:'Consider',              color: Text.Secondary }
}

export default function RecommendationCard({ pkg, onFeedback }) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(null)

  function act(e, val) {
    e.stopPropagation()
    setDone(val)
    onFeedback?.(pkg.category, pkg.recommendation, val)
  }

  const sig = signalLabel(pkg)

  return (
    <div style={{ background:Surface.Card, borderRadius:Radius.card, marginBottom:Space.sm, overflow:'hidden' }}>
      <button onClick={() => setOpen(o=>!o)}
        style={{ width:'100%', background:'none', border:'none', cursor:'pointer',
          textAlign:'left', fontFamily:'inherit', padding:`${Space.md}px ${Space.lg}px` }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:Space.md }}>
          <span style={{ fontSize:FontSize.Heading2, flexShrink:0, marginTop:1 }}>{pkg.icon}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:Space.xs }}>
              <p style={{ fontSize:FontSize.Caption, color:Text.Secondary, textTransform:'capitalize',
                fontWeight:FontWeight.Medium }}>{pkg.category}</p>
              <span style={{ fontSize:FontSize.Badge, fontWeight:FontWeight.Bold, color:sig.color }}>
                {sig.text}
              </span>
            </div>
            <p style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Bold, color:Text.Primary,
              lineHeight:1.3, marginBottom:pkg.bestWindow ? Space.xs : 0 }}>
              {pkg.recommendation || pkg.summary}
            </p>
            {pkg.bestWindow && (
              <p style={{ fontSize:FontSize.Caption, color:Accent, fontWeight:FontWeight.Bold, marginTop:Space.xs }}>
                ⏰ {pkg.bestWindow}
              </p>
            )}
          </div>
          <span style={{ fontSize:FontSize.Caption, color:Text.Secondary, flexShrink:0, paddingTop:2 }}>
            {open?'▴':'▾'}
          </span>
        </div>
      </button>
      {open && (
        <div className="fade-in" style={{ borderTop:`1px solid ${Surface.Line}`,
          padding:`${Space.md}px ${Space.lg}px` }}>
          {pkg.reasoning && (
            <div style={{ marginBottom:Space.md }}>
              <p style={{ fontSize:FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
                color:Text.Secondary, fontWeight:FontWeight.Medium, marginBottom:Space.xs }}>Why now</p>
              <p style={{ fontSize:FontSize.BodySmall, color:Text.Secondary, lineHeight:1.5 }}>{pkg.reasoning}</p>
            </div>
          )}
          {pkg.bestWindow && (
            <div style={{ marginBottom:Space.md }}>
              <p style={{ fontSize:FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
                color:Text.Secondary, fontWeight:FontWeight.Medium, marginBottom:Space.xs }}>Best time</p>
              <p style={{ fontSize:FontSize.Body, color:Accent, fontWeight:FontWeight.Bold }}>{pkg.bestWindow}</p>
            </div>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:Space.sm, marginBottom:Space.md }}>
            <ConfidenceBadge level={pkg.confidence} size={FontSize.Badge} />
            <span style={{ fontSize:FontSize.Badge, color:Text.Secondary }}>confidence</span>
          </div>
          {!done ? (
            <div>
              <p style={{ fontSize:FontSize.Badge, color:Text.Secondary, marginBottom:Space.xs }}>
                Was this useful?
              </p>
              <div style={{ display:'flex', gap:Space.sm, flexWrap:'wrap' }}>
                {[['helpful','✓ Worked well'],['not_helpful','Not quite'],['skipped','Skip']].map(([v,l])=>(
                  <button key={v} onClick={e=>act(e,v)} style={{
                    background:'rgba(255,255,255,0.05)', border:'none', borderRadius:Radius.sm,
                    padding:`6px 10px`, fontSize:FontSize.Caption, color:Text.Secondary,
                    cursor:'pointer', fontFamily:'inherit', fontWeight:FontWeight.Medium, minHeight:32 }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          ) : <p style={{ fontSize:FontSize.Caption, color:Text.Secondary }}>✓ Got it — thank you.</p>}
        </div>
      )}
    </div>
  )
}
