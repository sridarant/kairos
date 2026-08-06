/**
 * RecommendationSection v30.1
 * WS10: clearer headings — "Today's Priorities" / "Worth Considering"
 * Priority labels removed (they added clutter, not clarity)
 */
import { useState } from 'react'
import { SectionTitle, EmptyState } from '../../common/index.jsx'
import { Surface, Text, Radius, FontSize, Space } from '../../../styles/tokens/index.js'
import RecommendationCard from '../../cards/RecommendationCard.jsx'

export default function RecommendationSection({ packages, onFeedback }) {
  const [showAll, setShowAll] = useState(false)
  const top  = (packages || []).slice(0, 3)
  const rest = (packages || []).slice(3)

  return (
    <section aria-label="Today's Priorities" style={{ marginBottom: Space.xs }}>
      <SectionTitle>Today's Priorities</SectionTitle>
      {top.length > 0
        ? top.map((p, i) => <RecommendationCard key={p.id || i} pkg={p} onFeedback={onFeedback} />)
        : <EmptyState icon="📋" title="No recommendations yet"
            body="Your guidance will appear once the day is analysed." />}

      {rest.length > 0 && (
        <>
          {showAll && (
            <>
              <p style={{ fontSize:11, color:"var(--gray-4)", textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:600, marginBottom:10, marginTop:16 }}>Worth Considering</p>
              {rest.map((p, i) => (
                <RecommendationCard key={p.id || `r${i}`} pkg={p} onFeedback={onFeedback} />
              ))}
            </>
          )}
          <button onClick={() => setShowAll(v => !v)} style={{
            width:'100%', background:'none', border:`1px solid ${Surface.Line}`,
            borderRadius: Radius.lg, color: Text.Secondary, fontSize: FontSize.BodySmall,
            padding:'10px', cursor:'pointer', fontFamily:'inherit', marginTop: Space.xs, minHeight:40 }}>
            {showAll ? '▴ Show fewer areas' : `▾ ${rest.length} more areas to consider`}
          </button>
        </>
      )}
    </section>
  )
}
