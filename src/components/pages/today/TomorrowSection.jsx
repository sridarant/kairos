/**
 * TomorrowSection v30.10.4 — Compact, text-based.
 *
 * R2.4: removed the heavy card, StarRating, ConfidenceBadge, and prep-tip copy.
 * Stars are secondary. Shows: outlook word + best window, one line, tap to expand.
 */
import { Surface, Text, Accent, Suitability, Space, FontSize, FontWeight } from '../../../styles/tokens/index.js'

const TIER_DISPLAY = { Excellent:'Exceptional', Good:'Strong', Neutral:'Moderate', Moderate:'Challenging', Challenging:'Caution' }

export default function TomorrowSection({ brief, onFetchFuture }) {
  const tomorrow = brief?.tomorrowPreview
  if (!tomorrow) return null

  // Derive tier from stars
  const tier = tomorrow.stars >= 5 ? 'Excellent' : tomorrow.stars >= 4 ? 'Good' :
    tomorrow.stars >= 3 ? 'Neutral' : tomorrow.stars >= 2 ? 'Moderate' : 'Challenging'
  const tierColor = Suitability[tier] || Text.Secondary
  const label = TIER_DISPLAY[tier] || tier

  return (
    <section aria-label="Tomorrow">
      <p style={{ fontSize:FontSize.Label, textTransform:'uppercase', letterSpacing:'0.08em',
        color:Text.Muted, fontWeight:FontWeight.Medium, marginBottom:Space.md }}>
        Tomorrow
      </p>
      <button onClick={() => onFetchFuture?.(1)}
        style={{ width:'100%', textAlign:'left', background:'none', border:'none', cursor:'pointer',
          padding:0, fontFamily:'inherit' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:FontSize.Body, fontWeight:FontWeight.SemiBold, color:tierColor }}>
            {label}
          </span>
          {tomorrow.bestWindow && (
            <span style={{ fontSize:FontSize.Caption, color:Text.Secondary }}>
              {tomorrow.bestWindow}
            </span>
          )}
        </div>
        {tomorrow.theme && (
          <p style={{ fontSize:FontSize.Caption, color:Text.Muted, marginTop:4 }}>
            {tomorrow.theme}
          </p>
        )}
      </button>
    </section>
  )
}
