/**
 * UpcomingSection v29.3
 *
 * More prominent — encourages planning over reacting.
 * Stronger visual language: numbered sequence, clear day callout.
 */
import { useMemo } from 'react'
import { SectionTitle, StarRating, ConfidenceBadge } from '../../common/index.jsx'
import { Surface, Text, Accent, Radius, Space, FontSize, FontWeight, Gap } from '../../../styles/tokens/index.js'

function formatDaysAhead(n) {
  if (n === 1) return 'Tomorrow'
  if (n === 2) return 'In 2 days'
  if (n <= 7)  return `In ${n} days`
  return 'This month'
}

export default function UpcomingSection({ opportunities, weeklyPlan, onFetchFuture }) {
  const items = useMemo(() => {
    const seen = new Set()
    const opp = (opportunities || []).map(o => ({
      label: o.label, reason: o.title, confidence: o.confidence,
      daysAhead: o.daysAhead, stars: o.stars
    }))
    const wkDays = (weeklyPlan?.days || [])
      .filter(d => d.daysAhead > 0 && d.stars >= 4)
      .map(d => ({
        label: d.label, reason: d.summary, confidence: d.confidenceLabel,
        daysAhead: d.daysAhead, stars: d.stars
      }))
    return [...opp, ...wkDays]
      .filter(m => { if (seen.has(m.label)) return false; seen.add(m.label); return true })
      .slice(0, 3)
  }, [opportunities, weeklyPlan])

  if (!items.length) return null

  return (
    <section aria-label="Upcoming Opportunities" style={{ marginBottom: Space.xs }}>
      <SectionTitle>Coming Up</SectionTitle>
      {items.map((item, i) => (
        <div key={i} onClick={() => item.daysAhead > 0 && onFetchFuture?.(item.daysAhead)}
          style={{ display:'flex', alignItems:'center', gap: Space.md,
            padding:'12px 14px', background: Surface.Card, borderRadius: Radius.card,
            marginBottom: Gap.card, cursor: item.daysAhead > 0 ? 'pointer' : 'default' }}>
          {/* Day callout */}
          <div style={{ flexShrink:0, textAlign:'center', minWidth:48 }}>
            <p style={{ fontSize: FontSize.Caption, color: Accent, fontWeight: FontWeight.Bold,
              textTransform:'uppercase', letterSpacing:'0.06em', lineHeight:1 }}>
              {formatDaysAhead(item.daysAhead)}
            </p>
            <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Heavy, color: Text.Primary, lineHeight:1.1 }}>
              {item.label?.split(' ')[0] || item.label}
            </p>
          </div>
          {/* Divider */}
          <div style={{ width:1, alignSelf:'stretch', background: Surface.Line }} />
          {/* Content */}
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize: FontSize.BodySmall, color: Text.Primary, lineHeight:1.4, marginBottom: Space.xs }}>
              {item.reason}
            </p>
            <div style={{ display:'flex', alignItems:'center', gap: Space.sm }}>
              <StarRating value={item.stars} size={FontSize.Caption} />
              <ConfidenceBadge level={item.confidence} size={FontSize.Badge} />
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}
