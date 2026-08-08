/**
 * RecommendationSection v30.4
 *
 * WS4 progressive disclosure: top 3 visible, rest expandable.
 * WS5 priority ranks: Top Opportunity / Important / Worth Considering / Be Mindful
 * WS6 non-repetitive language: signal labels come from quality/tier, not templates
 */
import { useState } from 'react'
import { SectionTitle, EmptyState, GhostButton } from '../../common/index.jsx'
import { Surface, Text, Status, Accent, Radius, Space, FontSize, FontWeight } from '../../../styles/tokens/index.js'
import RecommendationCard from '../../cards/RecommendationCard.jsx'

// WS5: Priority language — maps to tier based on position + quality
function priorityBadge(pkg, rank) {
  if (pkg.quality === 'caution' || pkg.stars <= 1) {
    return { label:'Be mindful', color: Status.Danger, bg:'rgba(248,113,113,0.1)' }
  }
  if (rank === 0 && pkg.quality === 'supportive') {
    return { label:'Top opportunity', color: Accent, bg:`${Accent}15` }
  }
  if (rank <= 1 && pkg.stars >= 4) {
    return { label:'Important today', color: Status.Success, bg:'rgba(74,222,128,0.1)' }
  }
  if (pkg.stars >= 3) {
    return { label:'Worth considering', color: Text.Secondary, bg:'transparent' }
  }
  return null
}

export default function RecommendationSection({ packages, onFeedback }) {
  const [showAll, setShowAll] = useState(false)
  const sorted = packages || []
  const top    = sorted.slice(0, 3)
  const rest   = sorted.slice(3)

  if (!top.length) return (
    <section style={{ marginBottom: Space.xs }}>
      <SectionTitle>Where to Focus</SectionTitle>
      <EmptyState icon="📋" title="Preparing guidance…"
        body="Your personalised priorities will appear shortly." />
    </section>
  )

  return (
    <section aria-label="Today's Priorities" style={{ marginBottom: Space.xs }}>
      <SectionTitle>Today's Priorities</SectionTitle>

      {top.map((p, i) => {
        const badge = priorityBadge(p, i)
        return (
          <div key={p.id || i}>
            {badge && (
              <div style={{ display:'inline-flex', alignItems:'center', marginBottom: Space.xs,
                background: badge.bg, borderRadius: Radius.pill,
                padding:'3px 10px' }}>
                <p style={{ fontSize: FontSize.Badge, color: badge.color, fontWeight: FontWeight.Bold }}>
                  {badge.label}
                </p>
              </div>
            )}
            <RecommendationCard pkg={p} onFeedback={onFeedback} />
          </div>
        )
      })}

      {rest.length > 0 && (<>
        {showAll && (
          <>
            <p style={{ fontSize: FontSize.Caption, color: Text.Secondary,
              marginBottom: Space.sm, marginTop: Space.md,
              textTransform:'uppercase', letterSpacing:'0.07em', fontWeight: FontWeight.Medium }}>
              Additional guidance
            </p>
            {rest.map((p, i) => (
              <RecommendationCard key={p.id || `r${i}`} pkg={p} onFeedback={onFeedback} />
            ))}
          </>
        )}
        <button onClick={() => setShowAll(v => !v)} style={{
          width:'100%', background:'none', border:`1px solid ${Surface.Line}`,
          borderRadius: Radius.lg, color: Text.Secondary, fontSize: FontSize.BodySmall,
          padding:'10px', cursor:'pointer', fontFamily:'inherit',
          marginTop: Space.xs, minHeight:40 }}>
          {showAll ? '▴ Show fewer areas' : `▾ ${rest.length} more guidance areas`}
        </button>
      </>)}
    </section>
  )
}
