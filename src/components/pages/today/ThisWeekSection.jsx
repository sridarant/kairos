/**
 * ThisWeekSection v29.3
 *
 * Day-first hierarchy: the DAY is the hero, category is secondary.
 * Stronger visual weight on day name.
 */
import { StarRating, ConfidenceBadge, SectionTitle, EmptyState } from '../../common/index.jsx'
import { Surface, Text, Status, Accent, Radius, Space, Gap, FontSize, FontWeight, Opacity } from '../../../styles/tokens/index.js'

function DayCard({ day, onFetchFuture }) {
  return (
    <button onClick={() => day.daysAhead > 0 && onFetchFuture?.(day.daysAhead)}
      aria-label={`${day.bestDay}: best ${day.label} day`}
      style={{ background: Surface.Card, border:'none', borderRadius: Radius.card, padding:'12px 12px',
        cursor: day.daysAhead > 0 ? 'pointer' : 'default', textAlign:'left', fontFamily:'inherit',
        width:'100%', display:'flex', flexDirection:'column' }}>
      {/* Day name — primary visual element */}
      <p style={{ fontSize: FontSize.Heading3, fontWeight: FontWeight.Heavy, color: Text.Primary,
        letterSpacing:'-0.01em', marginBottom: 2, lineHeight: 1.1 }}>
        {day.bestDay}
      </p>
      {/* Category — secondary */}
      <p style={{ fontSize: FontSize.Caption, color: Text.Secondary, marginBottom: Space.sm }}>
        {day.icon} {day.label}
      </p>
      <div style={{ display:'flex', alignItems:'center', gap: Space.xs }}>
        <StarRating value={day.stars} size={FontSize.Caption} />
        <ConfidenceBadge level={day.confidence} size={FontSize.Badge} />
      </div>
    </button>
  )
}

export default function ThisWeekSection({ weeklyPlan, onFetchFuture }) {
  if (!weeklyPlan?.categories?.length) return (
    <section style={{ marginBottom: Space.xs }}>
      <SectionTitle>This Week</SectionTitle>
      <EmptyState icon="📅" title="Building your week plan…" />
    </section>
  )

  const highlights = weeklyPlan.categories.slice(0, 4)

  return (
    <section aria-label="This Week" style={{ marginBottom: Space.xs }}>
      <SectionTitle>This Week</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: Gap.grid }}>
        {highlights.map((h, i) => <DayCard key={i} day={h} onFetchFuture={onFetchFuture} />)}
      </div>

      {weeklyPlan.challenging && (
        <div style={{ display:'flex', alignItems:'center', gap: Space.md, marginTop: Gap.card,
          background:'rgba(248,113,113,0.07)', borderRadius: Radius.card, padding:'10px 12px' }}>
          <div style={{ flex:1 }}>
            <p style={{ fontSize: FontSize.Caption, color: Status.Danger, fontWeight: FontWeight.Medium,
              marginBottom: 2, textTransform:'uppercase', letterSpacing:'0.07em' }}>
              Most Challenging
            </p>
            <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold, color: Text.Primary }}>
              {weeklyPlan.challenging.label}
            </p>
          </div>
          <p style={{ fontSize: FontSize.BodySmall, color: Text.Secondary }}>{weeklyPlan.challenging.summary}</p>
        </div>
      )}
    </section>
  )
}
