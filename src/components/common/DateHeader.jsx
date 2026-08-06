/**
 * DateHeader v30.1
 * Always visible. Establishes WHO + WHEN context at a glance.
 * Shown even during loading so users always know what they're waiting for.
 */
import { Text, Accent, Status, Surface, FontSize, FontWeight, Space, Radius } from '../../styles/tokens/index.js'

export default function DateHeader({ dateContext, primaryUser, profileStatus, onReturnToday }) {
  if (!dateContext) return null

  const isFuture     = dateContext.daysAhead > 0
  const showReturn   = isFuture
  const isDemo       = profileStatus === 'demo'
  const whoLabel     = primaryUser?.name
    ? `Guidance for ${primaryUser.name.split(' ')[0]}`
    : isDemo ? 'Demo recommendations' : 'Your guidance'

  return (
    <div style={{ marginBottom: Space.md }}>
      {/* Date row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: Space.xs }}>
        <div>
          <div style={{ display:'flex', alignItems:'baseline', gap: Space.sm }}>
            <span style={{ fontSize: FontSize.Heading3, fontWeight: FontWeight.Heavy,
              color: isFuture ? Accent : Text.Primary, lineHeight:1 }}>
              {dateContext.relativeLabel}
            </span>
            <span style={{ fontSize: FontSize.Caption, color: Text.Secondary }}>
              {dateContext.weekday}, {dateContext.dayMonth}
            </span>
          </div>
          {/* Who line */}
          <p style={{ fontSize: FontSize.Badge, color: isDemo ? '#f87171' : Text.Secondary, marginTop:2 }}>
            {isDemo ? '⚠ ' : ''}{whoLabel}
          </p>
        </div>
        {showReturn && (
          <button onClick={onReturnToday} style={{
            background:'none', border:`1px solid ${Accent}55`,
            borderRadius: Radius.pill, color: Accent, fontSize: FontSize.Badge,
            fontWeight: FontWeight.Bold, padding:'4px 12px', cursor:'pointer',
            fontFamily:'inherit', minHeight:30, flexShrink:0
          }}>
            ← Back to Today
          </button>
        )}
      </div>
      {/* Visual indicator when viewing future */}
      {isFuture && (
        <div style={{ background:`${Accent}11`, borderRadius: Radius.sm,
          padding:'4px 10px', display:'inline-block' }}>
          <p style={{ fontSize: FontSize.Badge, color: Accent, fontWeight: FontWeight.Bold }}>
            Viewing {dateContext.daysAhead === 1 ? "tomorrow's" : `+${dateContext.daysAhead} day`} guidance
          </p>
        </div>
      )}
    </div>
  )
}
