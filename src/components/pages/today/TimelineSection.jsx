/**
 * TimelineSection v30.8 — Compact, minimal.
 *
 * Three columns per row: time | activity | quality
 * No coloured dots. No star ratings on every row.
 * Colour used only on "Excellent" to mark it as the primary window.
 */
import { memo } from 'react'
import { Surface, Text, Accent, Status, Quality } from '../../../styles/tokens/index.js'
import { Space, FontSize, FontWeight } from '../../../styles/tokens/index.js'

function qualityMarker(q) {
  if (q === 'Excellent')  return { color: Accent,        label: 'Best' }
  if (q === 'Good')       return { color: Text.Secondary, label: 'Good' }
  if (q === 'Low energy') return { color: Status.Danger,  label: 'Low' }
  return                         { color: Text.Muted,     label: '' }
}

function TimelineRow({ entry }) {
  const mark = qualityMarker(entry.quality)
  return (
    <div style={{ display:'grid', gridTemplateColumns:'70px 1fr auto',
      gap:Space.sm, padding:`${Space.sm}px 0`,
      borderBottom:`1px solid ${Surface.Line}`,
      alignItems:'baseline' }}>
      <span style={{ fontSize:FontSize.Caption, color:Text.Muted, fontVariantNumeric:'tabular-nums' }}>
        {entry.startTime}
      </span>
      <span style={{ fontSize:FontSize.Caption, color:
        entry.quality === 'Excellent' ? Text.Primary : Text.Secondary,
        fontWeight: entry.quality === 'Excellent' ? FontWeight.Medium : FontWeight.Regular }}>
        {entry.label || entry.description}
      </span>
      {mark.label && (
        <span style={{ fontSize:FontSize.Badge, color:mark.color, fontWeight:FontWeight.Medium }}>
          {mark.label}
        </span>
      )}
    </div>
  )
}

function _TimelineSection({ timeline }) {
  if (!timeline?.length) return null
  return (
    <section aria-label="Today's Timeline">
      <p style={{ fontSize:FontSize.Label, textTransform:'uppercase', letterSpacing:'0.08em',
        color:Text.Muted, fontWeight:FontWeight.Medium, marginBottom:Space.md }}>
        Timeline
      </p>
      <div>
        {timeline.map((t,i) => <TimelineRow key={i} entry={t} />)}
      </div>
    </section>
  )
}
export default memo(_TimelineSection)
