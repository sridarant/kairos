/**
 * RecommendationCard v29.3
 * Intelligent advice card. Feels like guidance, not a status panel.
 * Expandable with What / Why / When. Feedback inline.
 */
import { useState } from 'react'
import { ConfidenceBadge } from '../common/index.jsx'
import { Surface, Text, Status, Accent, Space, Radius, FontSize, FontWeight } from '../../styles/tokens/index.js'
import { FEEDBACK } from '../../constants/index.js'

// Richer confidence wording for card context
const CONF_DESC = {
  High:   'Strong signal',
  Medium: 'Good signal',
  Low:    'Weaker signal',
}

export default function RecommendationCard({ pkg, onFeedback }) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(null)

  function act(e, val) {
    e.stopPropagation()
    setDone(val)
    onFeedback?.(pkg.category, pkg.recommendation, val)
  }

  return (
    <div style={{ background: Surface.Card, borderRadius: Radius.card, marginBottom: Space.sm,
      overflow:'hidden' }} aria-label={`${pkg.title} recommendation`}>

      {/* Collapsed: scannable summary */}
      <button onClick={() => setOpen(o => !o)}
        style={{ width:'100%', background:'none', border:'none', cursor:'pointer',
          textAlign:'left', fontFamily:'inherit', padding:`${Space.md}px ${Space.lg}px` }}>

        <div style={{ display:'flex', alignItems:'flex-start', gap: Space.md }}>
          <span style={{ fontSize: FontSize.Heading2, flexShrink:0, marginTop:1 }}>{pkg.icon}</span>
          <div style={{ flex:1, minWidth:0 }}>
            {/* Category + Confidence on same line */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: Space.xs }}>
              <p style={{ fontSize: FontSize.Caption, color: Text.Secondary, textTransform:'capitalize',
                fontWeight: FontWeight.Medium }}>
                {pkg.category}
              </p>
              <span style={{ fontSize: FontSize.Badge, color: Text.Secondary }}>
                {CONF_DESC[pkg.confidence] || 'Good signal'}
              </span>
            </div>
            {/* Recommendation — the actual advice */}
            <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold, color: Text.Primary,
              lineHeight:1.3, marginBottom: pkg.bestWindow ? Space.xs : 0 }}>
              {pkg.recommendation || pkg.summary}
            </p>
            {/* Best time inline */}
            {pkg.bestWindow && (
              <p style={{ fontSize: FontSize.Caption, color: Accent, fontWeight: FontWeight.Bold, marginTop: Space.xs }}>
                ⏰ {pkg.bestWindow}
              </p>
            )}
          </div>
          <span style={{ fontSize: FontSize.Caption, color: Text.Secondary, flexShrink:0, paddingTop:2 }}>
            {open ? '▴' : '▾'}
          </span>
        </div>
      </button>

      {/* Expanded: Why + When + Feedback */}
      {open && (
        <div className="fade-in" style={{ borderTop:`1px solid ${Surface.Line}`,
          padding:`${Space.md}px ${Space.lg}px` }}>

          {pkg.reasoning && (
            <div style={{ marginBottom: Space.md }}>
              <p style={{ fontSize: FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
                color: Text.Secondary, fontWeight: FontWeight.Medium, marginBottom: Space.xs }}>
                Why now
              </p>
              <p style={{ fontSize: FontSize.BodySmall, color: Text.Secondary, lineHeight:1.5 }}>
                {pkg.reasoning}
              </p>
            </div>
          )}

          {pkg.bestWindow && (
            <div style={{ marginBottom: Space.md }}>
              <p style={{ fontSize: FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
                color: Text.Secondary, fontWeight: FontWeight.Medium, marginBottom: Space.xs }}>
                Best time
              </p>
              <p style={{ fontSize: FontSize.Body, color: Accent, fontWeight: FontWeight.Bold }}>
                {pkg.bestWindow}
              </p>
            </div>
          )}

          {/* Feedback */}
          {!done ? (
            <div style={{ display:'flex', gap: Space.sm, flexWrap:'wrap' }}>
              {[[FEEDBACK.HELPFUL,'✓ Acting on this'],[FEEDBACK.NOT_HELPFUL,'Not for me'],[FEEDBACK.SKIPPED,'Skip for now']].map(([v,l]) => (
                <button key={v} onClick={e => act(e,v)} style={{
                  background:'rgba(255,255,255,0.05)', border:'none', borderRadius: Radius.sm,
                  padding:`6px 10px`, fontSize: FontSize.Caption, color: Text.Secondary,
                  cursor:'pointer', fontFamily:'inherit', fontWeight: FontWeight.Medium, minHeight:32 }}>
                  {l}
                </button>
              ))}
            </div>
          ) : <p style={{ fontSize: FontSize.Caption, color: Text.Secondary }}>✓ Got it — thank you.</p>}
        </div>
      )}
    </div>
  )
}
