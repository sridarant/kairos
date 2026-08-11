/**
 * RecommendationRow v30.8 — Compact, typography-led recommendation.
 *
 * Replaces RecommendationCard's heavy card + badge + star + emoji design.
 *
 * Visual language:
 *   • Primary: larger type, left indicator dot
 *   • Caution: amber left border
 *   • Default: simple row with expand
 *
 * No cards. No star ratings. No coloured badges.
 * Colour used only as meaning (danger accent for caution).
 */
import { useState } from 'react'
import { Surface, Text, Status, Accent } from '../../styles/tokens/index.js'
import { Space, FontSize, FontWeight, Radius } from '../../styles/tokens/index.js'

export default function RecommendationRow({ pkg, primary, caution, onFeedback }) {
  const [open,  setOpen]  = useState(primary)  // top rec starts open
  const [voted, setVoted] = useState(null)

  if (!pkg) return null

  const accentColor = caution ? Status.Danger : Accent
  const borderLeft  = caution
    ? `3px solid ${Status.Danger}`
    : primary
      ? `3px solid ${Accent}`
      : `3px solid ${Surface.Line}`

  function vote(e, val) {
    e.stopPropagation()
    setVoted(val)
    onFeedback?.(pkg.category, pkg.recommendation, val)
  }

  return (
    <div style={{ borderLeft, paddingLeft:Space.lg, marginBottom:Space.xl }}>
      {/* Category label */}
      <p style={{ fontSize:FontSize.Label, textTransform:'uppercase',
        letterSpacing:'0.07em', color:caution ? Status.Danger : Text.Muted,
        fontWeight:FontWeight.Medium, marginBottom:Space.xs }}>
        {pkg.category}
      </p>

      {/* Recommendation text */}
      <p style={{ fontSize: primary ? FontSize.Body : FontSize.BodySmall,
        fontWeight: primary ? FontWeight.SemiBold : FontWeight.Regular,
        color:Text.Primary, lineHeight:1.5, marginBottom:Space.xs }}>
        {pkg.recommendation || pkg.summary}
      </p>

      {/* Best window inline */}
      {pkg.bestWindow && (
        <p style={{ fontSize:FontSize.Caption, color:accentColor, fontWeight:FontWeight.Medium }}>
          {pkg.bestWindow}
        </p>
      )}

      {/* Expand: reasoning + feedback */}
      {open && (
        <div style={{ marginTop:Space.sm }}>
          {pkg.reasoning && (
            <p style={{ fontSize:FontSize.Caption, color:Text.Secondary,
              lineHeight:1.6, marginBottom:Space.sm }}>
              {pkg.reasoning}
            </p>
          )}
          {!voted ? (
            <div style={{ display:'flex', gap:Space.md }}>
              {[['helpful','Useful'],['not_helpful','Not quite'],['skipped','Skip']].map(([v,l])=>(
                <button key={v} onClick={e=>vote(e,v)}
                  style={{ background:'none', border:'none', padding:0,
                    fontSize:FontSize.Caption, color:Text.Muted,
                    cursor:'pointer', fontFamily:'inherit' }}>
                  {l}
                </button>
              ))}
            </div>
          ) : (
            <p style={{ fontSize:FontSize.Caption, color:Text.Muted }}>Thanks</p>
          )}
        </div>
      )}

      {/* Toggle expand (non-primary rows) */}
      {!primary && (
        <button onClick={() => setOpen(v=>!v)}
          style={{ background:'none', border:'none', padding:'2px 0 0',
            fontSize:FontSize.Caption, color:Text.Muted,
            cursor:'pointer', fontFamily:'inherit' }}>
          {open ? '−' : '+'}
        </button>
      )}
    </div>
  )
}
