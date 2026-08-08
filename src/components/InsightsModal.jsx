/**
 * InsightsModal v30.4.1 — Insights placeholder.
 *
 * ISSUE 4 FIX: No manual journaling workflow. No forms. No daily task.
 *
 * Contextual feedback happens on recommendation cards (post-window).
 * This screen is a minimal placeholder for future automatic pattern insights.
 * It shows recorded feedback history if any exists — nothing fabricated.
 */
import { computeInsight } from '../lib/utils.js'
import { SectionTitle, Caption, EmptyState } from './common/index.jsx'
import { Surface, Text, Status, Accent, Radius, Space, Pad, Gap, FontSize, FontWeight, Z } from '../styles/tokens/index.js'

const OUTCOME_LABEL = {
  helpful:     { label:'✓ Worked well',  color: Status.Success },
  neutral:     { label:'― Neutral',       color: Text.Secondary },
  not_helpful: { label:'✗ Didn\'t work', color: Status.Danger },
  skipped:     { label:'— Skipped',      color: Text.Secondary }
}

function FeedbackEntry({ entry }) {
  const date = entry.timestamp
    ? new Date(entry.timestamp).toLocaleDateString('en-GB', { day:'numeric', month:'short' })
    : ''
  const out = OUTCOME_LABEL[entry.outcome]

  return (
    <div style={{ background: Surface.Card, borderRadius: Radius.card, padding: Pad.cardSm, marginBottom: Gap.card }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: Space.xs }}>
        <span style={{ fontSize: FontSize.Caption, color: out?.color || Text.Secondary, fontWeight: FontWeight.Bold }}>
          {out?.label || entry.outcome}
        </span>
        <Caption>{date}</Caption>
      </div>
      {entry.category && entry.category !== 'general' && (
        <span style={{ fontSize: FontSize.Badge, color: Text.Secondary,
          background: Surface.Line, borderRadius: Radius.pill, padding:'2px 8px' }}>
          {entry.category}
        </span>
      )}
      {entry.action && entry.action !== 'outcome recorded' && (
        <p style={{ fontSize: FontSize.BodySmall, color: Text.Secondary, lineHeight:1.4, marginTop: Space.xs }}>
          {entry.action}
        </p>
      )}
    </div>
  )
}

export default function InsightsModal({ onClose, identity }) {
  const history = identity?.appState?.feedbackHistory || []
  const insight = computeInsight(history)
  const recent  = [...history].reverse().slice(0, 10).filter(e => e.outcome && e.outcome !== 'pending')
  const hasData = recent.length > 0

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background: Surface.Overlay,
        backdropFilter:'blur(4px)', zIndex: Z.overlay }} />
      <div className="slide-up" style={{
        position:'fixed', left:0, right:0, bottom:0, maxWidth:448, margin:'0 auto',
        maxHeight:'92vh', overflowY:'auto', background: Surface.Base,
        borderRadius: Radius.modal, zIndex: Z.modal }}>
        <div style={{ padding: Pad.modal }}>
          <div style={{ width:36, height:4, background: Surface.Line, borderRadius:2,
            margin:`0 auto ${Space.xl}px` }} />
          <p style={{ fontSize: FontSize.Heading3, fontWeight: FontWeight.Bold,
            color: Text.Primary, marginBottom: Space.xl }}>Insights</p>

          {insight && hasData && (
            <div style={{ background: Surface.Card, borderRadius: Radius.card, padding: Pad.card,
              marginBottom: Space.xl, display:'flex', gap: Space.md }}>
              <span style={{ fontSize: FontSize.Heading3 }}>💡</span>
              <p style={{ fontSize: FontSize.BodySmall, color: Text.Secondary, lineHeight:1.5 }}>{insight}</p>
            </div>
          )}

          {hasData ? (<>
            <SectionTitle>Recent Feedback</SectionTitle>
            <p style={{ fontSize: FontSize.Caption, color: Text.Secondary, marginBottom: Space.md, lineHeight:1.5 }}>
              Recorded when you respond to recommendations after their window has passed.
            </p>
            {recent.map((e, i) => <FeedbackEntry key={i} entry={e} />)}
          </>) : (
            <div style={{ textAlign:'center', padding:`${Space['3xl']}px ${Space.xl}px` }}>
              <p style={{ fontSize:32, marginBottom: Space.md }}>💡</p>
              <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold,
                color: Text.Primary, marginBottom: Space.sm }}>
                Insights will appear here
              </p>
              <p style={{ fontSize: FontSize.BodySmall, color: Text.Secondary, lineHeight:1.6 }}>
                As you interact with recommendations, Kairos records outcomes automatically.
                Patterns and insights appear here over time.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
