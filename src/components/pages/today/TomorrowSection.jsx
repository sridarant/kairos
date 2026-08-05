/**
 * TomorrowSection v29.3
 *
 * Tomorrow should feel like a natural extension of today.
 * Richer display: outlook, best window, one tip, preparation nudge.
 */
import { StarRating, ConfidenceBadge, SectionTitle } from '../../common/index.jsx'
import { Surface, Text, Status, Accent, Radius, Space, Pad, FontSize, FontWeight } from '../../../styles/tokens/index.js'

// Derive a forward-looking prep tip
function prepTip(stars, theme) {
  if (stars >= 4) return `Consider scheduling important work around ${theme?.toLowerCase() || 'your priorities'} tomorrow.`
  if (stars >= 3) return 'A steady day — good for routine tasks and follow-ups.'
  return 'A lighter day ahead — rest and recharge where possible.'
}

export default function TomorrowSection({ brief, onFetchFuture }) {
  const tomorrow = brief?.tomorrowPreview
  if (!tomorrow) return null

  const outlookLabel = tomorrow.stars >= 4 ? 'Positive' : tomorrow.stars >= 3 ? 'Balanced' : 'Quiet'
  const outlookColor = tomorrow.stars >= 4 ? Status.Success : tomorrow.stars >= 3 ? Accent : Text.Secondary

  return (
    <section aria-label="Tomorrow" style={{ marginBottom: Space.xs }}>
      <SectionTitle>Tomorrow</SectionTitle>
      <div onClick={() => onFetchFuture?.(1)} role="button" aria-label="Tap to see tomorrow in detail"
        style={{ background: Surface.Card, borderRadius: Radius.card, padding: Pad.card, cursor:'pointer' }}>

        {/* Header: outlook + confidence */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: Space.sm }}>
          <div style={{ display:'flex', alignItems:'center', gap: Space.sm }}>
            <StarRating value={tomorrow.stars} size={FontSize.CardTitle} />
            <span style={{ fontSize: FontSize.Body, fontWeight: FontWeight.Bold, color: outlookColor }}>
              {outlookLabel} day
            </span>
          </div>
          <ConfidenceBadge level={tomorrow.confidence} size={FontSize.Caption} />
        </div>

        {/* Theme + best window inline */}
        {(tomorrow.theme || tomorrow.bestWindow) && (
          <div style={{ display:'flex', gap: Space.md, marginBottom: Space.sm, flexWrap:'wrap' }}>
            {tomorrow.theme && (
              <span style={{ fontSize: FontSize.BodySmall, color: Text.Secondary }}>
                Theme: <strong style={{ color: Text.Primary }}>{tomorrow.theme}</strong>
              </span>
            )}
            {tomorrow.bestWindow && (
              <span style={{ fontSize: FontSize.BodySmall, color: Accent, fontWeight: FontWeight.Bold }}>
                ⏰ {tomorrow.bestWindow}
              </span>
            )}
          </div>
        )}

        {/* Summary */}
        <p style={{ fontSize: FontSize.BodySmall, color: Text.Secondary, lineHeight:1.5, marginBottom: Space.sm }}>
          {tomorrow.summary}
        </p>

        {/* Prep tip */}
        <p style={{ fontSize: FontSize.Caption, color: Text.Secondary, lineHeight:1.4,
          borderTop:`1px solid ${Surface.Line}`, paddingTop: Space.sm, fontStyle:'italic' }}>
          {prepTip(tomorrow.stars, tomorrow.theme)}
        </p>

        <p style={{ fontSize: FontSize.Badge, color: Text.Secondary, marginTop: Space.xs, opacity:0.5 }}>
          Tap to view tomorrow →
        </p>
      </div>
    </section>
  )
}
