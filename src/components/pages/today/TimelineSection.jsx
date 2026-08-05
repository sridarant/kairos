/**
 * TimelineSection v29.3
 *
 * Natural language descriptions. No repeated labels.
 * Richer guidance — feels like advice, not generated tags.
 */
import { SectionTitle, EmptyState } from '../../common/index.jsx'
import { Surface, Text, Quality as QualityC, Accent, Radius, Space, FontSize, FontWeight } from '../../../styles/tokens/index.js'

// Map timeline labels/qualities to natural guidance descriptions
const QUALITY_GUIDANCE = {
  Excellent:    'Ideal conditions. Prioritise your most important work.',
  Good:         'Favourable window. Good for focus and communication.',
  Moderate:     'Steady energy. Stick to routine tasks.',
  'Low energy': 'Rest or light work. Avoid major decisions.',
}

// Derive richer activity descriptions from label
function enrichLabel(label = '', quality = '') {
  const lower = label.toLowerCase()
  const map = {
    'deep work':        'Deep focus & creative work',
    'planning':         'Strategic planning',
    'communication':    'Conversations & messages',
    'routine':          'Routine tasks & admin',
    'rest':             'Rest & reflection',
    'creative':         'Creative thinking',
    'learning':         'Learning & research',
    'financial':        'Financial review',
    'spiritual':        'Quiet reflection',
    'family':           'Family time',
    'exercise':         'Movement & energy',
    'meetings':         'Collaboration',
    'documentation':    'Writing & documentation',
    'review':           'Review & consolidation',
    'focus':            'Focused work',
  }
  for (const [key, val] of Object.entries(map)) {
    if (lower.includes(key)) return val
  }
  return label || 'Quiet period'
}

function TimelineRow({ entry }) {
  const dotColor  = QualityC[entry.quality] || '#666'
  const guidance  = QUALITY_GUIDANCE[entry.quality] || 'Steady conditions.'
  const actLabel  = enrichLabel(entry.label, entry.quality)

  return (
    <div style={{ position:'relative', marginBottom: Space.md }}>
      {/* dot */}
      <div style={{ position:'absolute', left:-13, top:5, width:8, height:8,
        borderRadius:'50%', background: dotColor, border:'2px solid #000' }} />

      <div style={{ display:'flex', alignItems:'baseline', gap: Space.sm, marginBottom: 2 }}>
        {/* Time range */}
        <span style={{ fontSize: FontSize.BodySmall, fontWeight: FontWeight.Bold, color: dotColor, flexShrink:0 }}>
          {entry.startTime}{entry.endTime ? `–${entry.endTime}` : ''}
        </span>
        {/* Activity — richer label */}
        <span style={{ fontSize: FontSize.BodySmall, fontWeight: FontWeight.Medium, color: Text.Primary }}>
          {actLabel}
        </span>
      </div>

      {/* Guidance — one natural sentence */}
      <p style={{ fontSize: FontSize.Caption, color: Text.Secondary, lineHeight:1.45 }}>
        {entry.description && entry.description !== entry.label
          ? entry.description
          : guidance}
      </p>
    </div>
  )
}

export default function TimelineSection({ timeline }) {
  if (!timeline?.length) return (
    <section style={{ marginBottom: Space.xs }}>
      <SectionTitle>Today's Timeline</SectionTitle>
      <EmptyState icon="⏱" title="Timeline loading…" />
    </section>
  )

  return (
    <section aria-label="Today's Timeline" style={{ marginBottom: Space.xs }}>
      <SectionTitle>Today's Timeline</SectionTitle>
      <div style={{ position:'relative', paddingLeft:18 }}>
        {/* Vertical rail */}
        <div style={{ position:'absolute', left:5, top:6, bottom:6,
          width:2, background: Surface.Line, borderRadius: Radius.sm }} />
        {timeline.map((t, i) => <TimelineRow key={i} entry={t} />)}
      </div>
    </section>
  )
}
