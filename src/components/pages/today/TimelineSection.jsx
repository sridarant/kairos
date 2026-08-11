/**
 * TimelineSection v30.5
 * Quality reflects actual relative slot scores. No "Ideal conditions" repetition.
 * Shows star count for each slot.
 */
import { memo } from 'react'
import { SectionTitle, EmptyState } from '../../common/index.jsx'
import { Surface, Text, Quality as QualityC, Accent, Status, Radius, Space, FontSize, FontWeight } from '../../../styles/tokens/index.js'

const QUALITY_STARS = { Excellent:4, Good:3, Moderate:2, 'Low energy':1 }
// Quality colors from design tokens — imported via destructured aliases
// Status.Success = #4ade80, Accent = #facc15, Status.Caution = #fb923c, Status.Danger = #f87171
const QUALITY_COLOR = {
  Excellent:    Status.Success,
  Good:         Accent,
  Moderate:     Status.Caution,
  'Low energy': Status.Danger
}

function Stars({ count }) {
  return (
    <span style={{ fontSize:10, letterSpacing:1 }}>
      {Array.from({length:4},(_,i) => (
        <span key={i} style={{ opacity: i < count ? 1 : 0.2 }}>★</span>
      ))}
    </span>
  )
}

function TimelineRow({ entry }) {
  const color  = QUALITY_COLOR[entry.quality] || '#666'
  const stars  = QUALITY_STARS[entry.quality] || 2
  return (
    <div style={{ position:'relative', marginBottom:Space.md }}>
      <div style={{ position:'absolute', left:-13, top:5, width:8, height:8,
        borderRadius:'50%', background:color, border:'2px solid #000' }} />
      <div style={{ display:'flex', alignItems:'baseline', gap:Space.sm, marginBottom:2 }}>
        <span style={{ fontSize:FontSize.BodySmall, fontWeight:FontWeight.Bold, color, flexShrink:0 }}>
          {entry.startTime}{entry.endTime ? `–${entry.endTime}` : ''}
        </span>
        <span style={{ fontSize:FontSize.BodySmall, fontWeight:FontWeight.Medium, color:Text.Primary }}>
          {entry.label || entry.description}
        </span>
        <Stars count={stars} />
      </div>
    </div>
  )
}

function _TimelineSection({ timeline }) {
  if (!timeline?.length) return (
    <section style={{ marginBottom:Space.xs }}>
      <SectionTitle>Today's Timeline</SectionTitle>
      <EmptyState icon="⏱" title="Timeline loading…" />
    </section>
  )
  return (
    <section aria-label="Today's Timeline" style={{ marginBottom:Space.xs }}>
      <SectionTitle>Today's Timeline</SectionTitle>
      <div style={{ position:'relative', paddingLeft:18 }}>
        <div style={{ position:'absolute', left:5, top:6, bottom:6,
          width:2, background:Surface.Line, borderRadius:Radius.sm }} />
        {timeline.map((t,i) => <TimelineRow key={i} entry={t} />)}
      </div>
    </section>
  )
}
export default memo(_TimelineSection)
