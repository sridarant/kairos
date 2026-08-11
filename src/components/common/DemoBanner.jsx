/**
 * DemoBanner v30.1
 * More prominent. Never hidden for demo users.
 * Shows actionable "Set up profile" CTA.
 */
import { PROFILE_STATUS, PROFILE_STATUS_COLOR } from '../../app/config/userProfile.js'
import { Surface, Text, FontSize, FontWeight, Space, Radius } from '../../styles/tokens/index.js'

const MESSAGES = {
  [PROFILE_STATUS.DEMO]: {
    headline: '⚠ Demo Mode — recommendations are not personalised',
    body: 'Enter your name and date of birth to receive guidance tailored to you.',
    cta: 'Set up my profile'
  },
  [PROFILE_STATUS.INCOMPLETE]: {
    headline: '◑ Profile incomplete',
    body: 'Add your date of birth for personalised daily guidance.',
    cta: 'Complete profile'
  },
  [PROFILE_STATUS.BASIC]: {
    headline: '◕ Partially personalised',
    body: 'Add your birth time for more accurate timing recommendations.',
    cta: 'Add birth time'
  }
}

export default function DemoBanner({ profileStatus, onSetupProfile }) {
  if (!profileStatus || profileStatus === PROFILE_STATUS.PERSONALISED) return null
  const msg   = MESSAGES[profileStatus] || MESSAGES[PROFILE_STATUS.DEMO]
  const color = PROFILE_STATUS_COLOR[profileStatus] || Accent

  return (
    <div style={{
      background: `${color}0d`,
      border: `1px solid ${color}55`,
      borderRadius: Radius.lg,
      padding: `${Space.sm}px ${Space.md}px`,
      marginBottom: Space.sm
    }}>
      <p style={{ fontSize: FontSize.Caption, color, fontWeight: FontWeight.Bold, marginBottom: Space.xs }}>
        {msg.headline}
      </p>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap: Space.md }}>
        <p style={{ fontSize: FontSize.Badge, color: Text.Secondary, lineHeight:1.4, flex:1 }}>
          {msg.body}
        </p>
        <button onClick={onSetupProfile} style={{
          background: color, border:'none', borderRadius: Radius.md,
          padding:'6px 12px', fontSize: FontSize.Caption, fontWeight: FontWeight.Bold,
          color: '#000', cursor:'pointer', fontFamily:'inherit', flexShrink:0, minHeight:32,
          whiteSpace:'nowrap'
        }}>
          {msg.cta}
        </button>
      </div>
    </div>
  )
}
