/**
 * InsightsModal — Usage history and feedback analytics.
 * Data comes from identity.appState.feedbackHistory via IdentityManager.
 */
import { computeAnalytics, computeInsight } from '../lib/utils.js'
import { StandardCard, SectionTitle, Caption, FieldLabel, EmptyState } from './common/index.jsx'
import { Surface, Text, Status, Accent, Radius, Space, Pad, Gap, FontSize, FontWeight, Z } from '../styles/tokens/index.js'

function StatCard({ label, value, sub, color }) {
  return (
    <StandardCard>
      <FieldLabel text={label} />
      <p style={{ fontSize:FontSize.Heading2, fontWeight:FontWeight.Bold, color:color||Text.Primary, marginBottom:Space.xs }}>{value}</p>
      {sub && <Caption>{sub}</Caption>}
    </StandardCard>
  )
}

function FeedbackEntry({ entry }) {
  const date = entry.timestamp
    ? new Date(entry.timestamp).toLocaleDateString('en-GB', { day:'numeric', month:'short' })
    : ''
  const color = { helpful:Status.Success, not_helpful:Status.Danger, skipped:Text.Secondary }[entry.outcome] || Text.Secondary
  return (
    <div style={{ background:Surface.Card, borderRadius:Radius.card, padding:Pad.card, marginBottom:Gap.card }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:Space.xs }}>
        <span style={{ fontSize:FontSize.Caption, color, fontWeight:FontWeight.Bold, textTransform:'uppercase' }}>
          {entry.outcome || 'recorded'}
        </span>
        <Caption>{date}</Caption>
      </div>
      {entry.category && <p style={{ fontSize:FontSize.BodySmall, color:Text.Primary }}>{entry.category}</p>}
    </div>
  )
}

export default function InsightsModal({ onClose, identity }) {
  const history = identity?.appState?.feedbackHistory || []
  const stats   = computeAnalytics(history)
  const insight = computeInsight(history)
  const recent  = [...history].reverse().slice(0, 14)

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:Surface.Overlay,
        backdropFilter:'blur(4px)', zIndex:Z.overlay }} />
      <div className="slide-up" style={{
        position:'fixed', left:0, right:0, bottom:0, maxWidth:448, margin:'0 auto',
        maxHeight:'92vh', overflowY:'auto', background:Surface.Base,
        borderRadius:Radius.modal, zIndex:Z.modal }}>
        <div style={{ padding:Pad.modal }}>
          <div style={{ width:36, height:4, background:Surface.Line, borderRadius:2,
            margin:`0 auto ${Space.xl}px` }} />
          <p style={{ fontSize:FontSize.Heading3, fontWeight:FontWeight.Bold,
            marginBottom:Space.xl, color:Text.Primary }}>Your Insights</p>

          {insight && (
            <div style={{ background:Surface.Card, borderRadius:Radius.card, padding:Pad.card,
              marginBottom:Space.xl, display:'flex', gap:Space.md }}>
              <span style={{ fontSize:FontSize.Heading3 }}>💡</span>
              <p style={{ fontSize:FontSize.BodySmall, color:Text.Secondary, lineHeight:1.5 }}>{insight}</p>
            </div>
          )}

          <SectionTitle>Usage</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:Gap.grid, marginBottom:Space.xl }}>
            <StatCard label="Days Tracked" value={stats.totalDays||0} sub="Sessions" color={Accent} />
            <StatCard label="Act Rate" value={`${stats.actionRate||0}%`} sub="Recommendations taken" color={Status.Success} />
            {stats.bestDay && <StatCard label="Best Day" value={stats.bestDay} sub="Most active" />}
          </div>

          {recent.length > 0 ? (<>
            <SectionTitle>Recent Feedback</SectionTitle>
            {recent.map((e,i) => <FeedbackEntry key={i} entry={e} />)}
          </>) : <EmptyState icon="📖" title="No feedback yet"
            body="Your feedback will appear here as you interact with recommendations." />}
        </div>
      </div>
    </>
  )
}
