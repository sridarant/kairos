/**
 * InsightsScreen v30.5 — Automatic insights, no manual journal.
 * Empty state is honest. No fabricated data.
 */
import { computeInsight } from '../lib/utils.js'
import { Surface, Text, Status, Accent, Radius, Space, Pad, Gap, FontSize, FontWeight } from '../styles/tokens/index.js'

const OUTCOME_LABEL = {
  helpful:     { text:'✓ Worked well',  color: Status.Success },
  neutral:     { text:'― Neutral',       color: Text.Secondary },
  not_helpful: { text:'✗ Didn\'t work', color: Status.Danger },
  skipped:     { text:'— Skipped',      color: Text.Secondary }
}

function FeedbackEntry({ entry }) {
  const date = entry.timestamp
    ? new Date(entry.timestamp).toLocaleDateString('en-GB', { day:'numeric', month:'short' })
    : ''
  const out = OUTCOME_LABEL[entry.outcome]
  return (
    <div style={{ background:Surface.Card, borderRadius:Radius.card, padding:Pad.cardSm, marginBottom:Gap.card }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:Space.xs }}>
        <span style={{ fontSize:FontSize.Caption, color:out?.color || Text.Secondary, fontWeight:FontWeight.Bold }}>
          {out?.text || entry.outcome}
        </span>
        <span style={{ fontSize:FontSize.Badge, color:Text.Secondary }}>{date}</span>
      </div>
      {entry.category && entry.category !== 'general' && (
        <span style={{ fontSize:FontSize.Badge, color:Text.Secondary,
          background:Surface.Line, borderRadius:Radius.pill, padding:'2px 8px' }}>
          {entry.category}
        </span>
      )}
    </div>
  )
}

export default function InsightsScreen({ identity }) {
  const history = identity?.appState?.feedbackHistory || []
  const insight = computeInsight(history)
  const recent  = [...history].reverse().slice(0,10).filter(e => e.outcome && e.outcome !== 'pending')
  const hasData = recent.length > 0

  return (
    <div style={{ padding:`${Space['3xl']}px ${Space.xl}px` }}>
      <p style={{ fontSize:FontSize.Heading2, fontWeight:FontWeight.Heavy, color:Text.Primary, marginBottom:Space.xl }}>
        Insights
      </p>

      {hasData ? (<>
        {insight && (
          <div style={{ background:Surface.Card, borderRadius:Radius.card, padding:Pad.card,
            marginBottom:Space.xl, display:'flex', gap:Space.md }}>
            <span style={{ fontSize:FontSize.Heading3 }}>💡</span>
            <p style={{ fontSize:FontSize.BodySmall, color:Text.Secondary, lineHeight:1.5 }}>{insight}</p>
          </div>
        )}
        <p style={{ fontSize:FontSize.Caption, color:Text.Secondary, marginBottom:Space.md,
          textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:FontWeight.Medium }}>
          Recent Feedback
        </p>
        <p style={{ fontSize:FontSize.Caption, color:Text.Secondary, marginBottom:Space.xl, lineHeight:1.5 }}>
          Captured when you respond to recommendations.
        </p>
        {recent.map((e,i) => <FeedbackEntry key={i} entry={e} />)}
      </>) : (
        <div style={{ textAlign:'center', padding:`${Space['3xl']}px ${Space.xl}px`,
          background:Surface.Card, borderRadius:Radius.card }}>
          <p style={{ fontSize:32, marginBottom:Space.md }}>💡</p>
          <p style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Bold,
            color:Text.Primary, marginBottom:Space.md }}>
            Your insights are still building
          </p>
          <p style={{ fontSize:FontSize.BodySmall, color:Text.Secondary, lineHeight:1.6 }}>
            As you use Kairos and respond to recommendations, patterns will appear here automatically.
            No manual data entry required.
          </p>
        </div>
      )}
    </div>
  )
}
