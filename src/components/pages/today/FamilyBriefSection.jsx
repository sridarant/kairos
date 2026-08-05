/**
 * FamilyBriefSection v29.3
 *
 * Warmer, more personal language.
 * Family should feel human, not analytical.
 */
import { SectionTitle } from '../../common/index.jsx'
import { GhostButton } from '../../common/index.jsx'
import { Surface, Text, Status, Accent, Radius, Space, Pad, FontSize, FontWeight } from '../../../styles/tokens/index.js'

export default function FamilyBriefSection({ brief, daily, onFamilyPlan }) {
  const fb        = brief?.familyBrief
  const hasFamily = (daily?.members?.length || 0) > 1
  if (!hasFamily && !fb) return null

  const energy     = fb?.energy || 'Moderate'
  const bestWindow = fb?.bestWindow || null
  const activity   = fb?.activities?.[0] || null
  const caution    = fb?.avoid?.[0] || null
  const energyColor = energy === 'High' ? Status.Success : Accent

  const energyDesc = energy === 'High'
    ? 'Everyone is aligned — a great day to do something together.'
    : 'Energy is moderate — keep plans relaxed and flexible.'

  return (
    <section aria-label="Family Today" style={{ marginBottom: Space.xs }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: Space.sm }}>
        <SectionTitle>Family Today</SectionTitle>
        <GhostButton onClick={onFamilyPlan} small>Plan Together</GhostButton>
      </div>

      <div style={{ background: Surface.Card, borderRadius: Radius.card, padding: Pad.card }}>
        {/* Energy headline */}
        <div style={{ display:'flex', alignItems:'center', gap: Space.md, marginBottom: Space.md }}>
          <span style={{ fontSize: 24 }}>👨‍👩‍👧</span>
          <div>
            <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold, color: energyColor, marginBottom: 2 }}>
              {energy === 'High' ? 'Strong harmony' : 'Steady energy'}
            </p>
            <p style={{ fontSize: FontSize.Caption, color: Text.Secondary, lineHeight:1.4 }}>
              {energyDesc}
            </p>
          </div>
        </div>

        {/* Details row */}
        <div style={{ display:'flex', gap: Space.md, flexWrap:'wrap' }}>
          {bestWindow && (
            <div>
              <p style={{ fontSize: FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
                color: Text.Secondary, fontWeight: FontWeight.Medium, marginBottom: 2 }}>
                Best Together
              </p>
              <p style={{ fontSize: FontSize.Body, color: Accent, fontWeight: FontWeight.Bold }}>{bestWindow}</p>
            </div>
          )}
          {activity && (
            <div>
              <p style={{ fontSize: FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
                color: Text.Secondary, fontWeight: FontWeight.Medium, marginBottom: 2 }}>
                Recommended Together
              </p>
              <p style={{ fontSize: FontSize.Body, color: Text.Primary }}>{activity}</p>
            </div>
          )}
          {caution && (
            <div>
              <p style={{ fontSize: FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
                color: Status.Danger, fontWeight: FontWeight.Medium, marginBottom: 2 }}>
                Worth Noting
              </p>
              <p style={{ fontSize: FontSize.BodySmall, color: Text.Secondary }}>{caution}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
