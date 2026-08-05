/**
 * InsightsModal — Journal / History view. Migrated to Design System.
 */
import { computeAnalytics, computeInsight } from '../lib/dataClient'
import { StandardCard, SectionTitle, Caption, FieldLabel, EmptyState } from './common/index.jsx'
import { Surface, Text, Status, Confidence, Accent, Radius, Space, Pad, Gap, FontSize, FontWeight, Z } from '../styles/tokens/index.js'

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function StatCard({ label, value, sub, color }) {
  return (
    <StandardCard>
      <FieldLabel text={label} />
      <p style={{ fontSize: FontSize.Heading2, fontWeight: FontWeight.Bold, color: color || Text.Primary, marginBottom: Space.xs }}>{value}</p>
      {sub && <Caption>{sub}</Caption>}
    </StandardCard>
  )
}

function JournalEntry({ entry }) {
  const date = entry.timestamp
    ? new Date(entry.timestamp).toLocaleDateString('en-GB', { day:'numeric', month:'short' })
    : ''
  const confColor = { do: Status.Success, avoid: Status.Danger, wait: Status.Warning }[entry.decision] || Text.Secondary
  return (
    <div style={{ background: Surface.Card, borderRadius: Radius.card, padding: Pad.card, marginBottom: Gap.card }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: Space.xs }}>
        <span style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold, color: confColor, textTransform:'uppercase' }}>
          {entry.decision || 'WAIT'}
        </span>
        <Caption>{date}</Caption>
      </div>
      {entry.focus && <p style={{ fontSize: FontSize.BodySmall, color: Text.Primary, marginBottom: Space.xs }}>{entry.focus}</p>}
      {entry.outcome && (
        <p style={{ fontSize: FontSize.Caption, color: entry.outcome === 'yes' ? Status.Success : Status.Danger }}>
          {entry.outcome === 'yes' ? '✓ Acted on it' : '✗ Skipped'}
        </p>
      )}
    </div>
  )
}

export default function InsightsModal({ onClose, userData }) {
  const stats   = computeAnalytics(userData?.history || [])
  const insight = computeInsight(userData?.history || [])
  const history = (userData?.history || []).slice().reverse().slice(0, 14)

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background: Surface.Overlay, backdropFilter:'blur(4px)', zIndex: Z.overlay }} />
      <div className="slide-up" style={{
        position:'fixed', left:0, right:0, bottom:0, maxWidth:448, margin:'0 auto',
        maxHeight:'92vh', overflowY:'auto', background: Surface.Base, borderRadius: Radius.modal, zIndex: Z.modal }}>
        <div style={{ padding: Pad.modal }}>
          <div style={{ width:36, height:4, background: Surface.Line, borderRadius: Radius.sm, margin:`0 auto ${Space.xl}px` }} />
          <p style={{ fontSize: FontSize.Heading3, fontWeight: FontWeight.Bold, marginBottom: Space.xl, color: Text.Primary }}>Your Insights</p>

          {insight && (
            <div style={{ background: Surface.Card, borderRadius: Radius.card, padding: Pad.card, marginBottom: Space.xl,
              display:'flex', gap: Space.md }}>
              <span style={{ fontSize: FontSize.Heading3 }}>💡</span>
              <p style={{ fontSize: FontSize.BodySmall, color: Text.Secondary, lineHeight:1.5 }}>{insight}</p>
            </div>
          )}

          <SectionTitle>Usage Statistics</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: Gap.grid, marginBottom: Space.xl }}>
            <StatCard label="Days Tracked" value={stats.totalDays || 0} sub="Total sessions" color={Accent} />
            <StatCard label="Actions Taken" value={`${stats.actionRate || 0}%`} sub="Act rate" color={Status.Success} />
            <StatCard label="Best Day" value={stats.bestDay || '—'} sub="Historically" />
            <StatCard label="Best Window" value={stats.bestWindow || '—'} sub="Most productive" color={Accent} />
          </div>

          {history.length > 0 ? (<>
            <SectionTitle>Recent History</SectionTitle>
            {history.map((e, i) => <JournalEntry key={i} entry={e} />)}
          </>) : <EmptyState icon="📖" title="No history yet" body="Your decisions will appear here after your first session." />}
        </div>
      </div>
    </>
  )
}
