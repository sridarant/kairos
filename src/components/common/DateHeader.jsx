/**
 * DateHeader — establishes WHO + WHEN context at the top of every data screen.
 * Users should never wonder what date they're viewing.
 */
import { Text, Accent, Status, FontSize, FontWeight, Space } from '../../styles/tokens/index.js'

export default function DateHeader({ dateContext, primaryUser, profileStatus, onReturnToday }) {
  if (!dateContext) return null

  const showReturnBtn = !dateContext.isToday

  return (
    <div style={{ marginBottom: Space.md }}>
      {/* Primary: relative label (Today / Tomorrow / In 2 days) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: Space.sm }}>
          <span style={{ fontSize: FontSize.Heading3, fontWeight: FontWeight.Heavy, color: Text.Primary }}>
            {dateContext.relativeLabel}
          </span>
          <span style={{ fontSize: FontSize.Caption, color: Text.Secondary }}>
            {dateContext.weekday}, {dateContext.dayMonth}
          </span>
        </div>
        {showReturnBtn && (
          <button onClick={onReturnToday} style={{
            background: 'none', border: `1px solid ${Accent}44`,
            borderRadius: 20, color: Accent, fontSize: FontSize.Badge,
            fontWeight: 700, padding: '3px 10px', cursor: 'pointer',
            fontFamily: 'inherit', minHeight: 28
          }}>
            ← Today
          </button>
        )}
      </div>

      {/* Secondary: personalisation context */}
      {primaryUser?.name && (
        <p style={{ fontSize: FontSize.Badge, color: Text.Secondary, marginTop: 2 }}>
          Guidance for {primaryUser.name.split(' ')[0]}
        </p>
      )}
    </div>
  )
}
