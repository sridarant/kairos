/**
 * DemoBanner — shown when user is in demo mode or profile is incomplete.
 * Disappears once profile is fully personalised.
 */
import { PROFILE_STATUS, PROFILE_STATUS_COLOR, PROFILE_STATUS_DESC } from '../../app/config/userProfile.js'
import { Surface, Text, FontSize, Space, Radius } from '../../styles/tokens/index.js'

export default function DemoBanner({ profileStatus, onSetupProfile }) {
  if (!profileStatus || profileStatus === PROFILE_STATUS.PERSONALISED) return null

  const color = PROFILE_STATUS_COLOR[profileStatus] || '#fbbf24'
  const desc  = PROFILE_STATUS_DESC[profileStatus]  || ''

  return (
    <div style={{
      background: `${color}11`,
      border: `1px solid ${color}44`,
      borderRadius: Radius.lg,
      padding: '8px 12px',
      marginBottom: Space.sm,
      display: 'flex',
      alignItems: 'center',
      gap: Space.md
    }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: FontSize.Caption, color, fontWeight: 600, marginBottom: 2 }}>
          {profileStatus === PROFILE_STATUS.DEMO ? '⚠ Demo Mode' : '◑ Profile Incomplete'}
        </p>
        <p style={{ fontSize: FontSize.Badge, color: Text.Secondary, lineHeight: 1.4 }}>{desc}</p>
      </div>
      <button onClick={onSetupProfile} style={{
        background: color, border: 'none', borderRadius: Radius.md,
        padding: '5px 10px', fontSize: FontSize.Badge, fontWeight: 700,
        color: '#000', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, minHeight: 30
      }}>
        Set up
      </button>
    </div>
  )
}
