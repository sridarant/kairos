import { PrimaryButton, SecondaryButton, BodyText, Caption } from './common/index.jsx'
import { Surface, Text, Accent, Radius, Space, Pad, FontSize, FontWeight, Z } from '../styles/tokens/index.js'

export default function InviteModal({ onClose }) {
  async function share() {
    try {
      await navigator.share({ title:'Kairos', text:'Daily Vedic guidance for better decisions.', url: window.location.href })
    } catch { /* user cancelled or not supported */ }
    onClose()
  }
  async function copy() {
    await navigator.clipboard.writeText(window.location.href).catch(() => {})
    onClose()
  }
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background: Surface.Overlay, backdropFilter:'blur(4px)', zIndex:40 }} />
      <div className="slide-up" style={{
        position:'fixed', left:0, right:0, bottom:0, maxWidth:448, margin:'0 auto',
        background: Surface.Base, borderRadius: Radius.modal, zIndex:50, padding: Pad.modal }}>
        <div style={{ width:36, height:4, background: Surface.Line, borderRadius: Radius.sm, margin:`0 auto ${Space.xl}px` }} />
        <p style={{ fontSize: FontSize.Heading3, fontWeight: FontWeight.Bold, marginBottom: Space.sm, color: Text.Primary }}>Share Kairos</p>
        <BodyText muted style={{ marginBottom: Space['3xl'] }}>
          Help your family make better decisions with daily Vedic guidance.
        </BodyText>
        <PrimaryButton onClick={share} fullWidth style={{ marginBottom: Space.sm }}>Share Link</PrimaryButton>
        <SecondaryButton onClick={copy} style={{ width:'100%' }}>Copy Link</SecondaryButton>
      </div>
    </>
  )
}
