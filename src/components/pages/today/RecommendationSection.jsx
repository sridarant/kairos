/**
 * RecommendationSection v29.3
 *
 * Recommendations as an intelligent advice feed — not status panels.
 * Clear priority order, scannable at a glance.
 */
import { useState } from 'react'
import { SectionTitle, EmptyState } from '../../common/index.jsx'
import { Surface, Text, Radius, FontSize, Space, Gap } from '../../../styles/tokens/index.js'
import RecommendationCard from '../../cards/RecommendationCard.jsx'

// Priority label based on position
function priorityLabel(index) {
  if (index === 0) return 'Top priority'
  if (index === 1) return 'Also today'
  return 'Consider'
}

export default function RecommendationSection({ packages, onFeedback }) {
  const [showAll, setShowAll] = useState(false)
  const top  = (packages || []).slice(0, 3)
  const rest = (packages || []).slice(3)

  return (
    <section aria-label="Your Recommendations" style={{ marginBottom: Space.xs }}>
      <SectionTitle>Where to Focus</SectionTitle>
      {top.length > 0
        ? top.map((p, i) => (
            <div key={p.id || i}>
              {i > 0 && (
                <p style={{ fontSize: FontSize.Badge, color: Text.Secondary, marginBottom: Space.xs,
                  paddingLeft: Space.xs, opacity: 0.6 }}>
                  {priorityLabel(i)}
                </p>
              )}
              <RecommendationCard pkg={p} onFeedback={onFeedback} />
            </div>
          ))
        : <EmptyState icon="📋" title="No recommendations yet" body="Your guidance will appear shortly." />}

      {rest.length > 0 && (
        <>
          {showAll && rest.map((p, i) => (
            <RecommendationCard key={p.id || `r${i}`} pkg={p} onFeedback={onFeedback} />
          ))}
          <button onClick={() => setShowAll(v => !v)} style={{
            width:'100%', background:'none', border:`1px solid ${Surface.Line}`,
            borderRadius: Radius.lg, color: Text.Secondary, fontSize: FontSize.BodySmall,
            padding:'10px', cursor:'pointer', fontFamily:'inherit', marginTop: Space.xs, minHeight:40 }}>
            {showAll ? '▴ Show less' : `▾ ${rest.length} more guidance areas`}
          </button>
        </>
      )}
    </section>
  )
}
