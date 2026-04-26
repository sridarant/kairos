import { useState } from 'react'

const INVITE_TEXT = "I'm using Kairos for daily decision timing. Join me — let's align our timing.\nhttps://kairos.app"

export default function InviteModal({ onClose }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    try {
      navigator.clipboard.writeText(INVITE_TEXT)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select textarea
    }
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: 'Kairos', text: INVITE_TEXT }).catch(() => {})
    } else {
      handleCopy()
    }
  }

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)', zIndex: 40
      }} />
      <div className="slide-up" style={{
        position: 'fixed', bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: '100%', maxWidth: 448,
        background: 'var(--gray-1)',
        borderRadius: '20px 20px 0 0',
        padding: '24px 16px 40px',
        zIndex: 50
      }}>
        <div style={{ width: 36, height: 4, background: 'var(--gray-3)', borderRadius: 2, margin: '0 auto 20px' }} />
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Invite to Kairos</h2>
        <p style={{ fontSize: 13, color: 'var(--gray-4)', marginBottom: 20 }}>
          Align timing with family and friends.
        </p>

        {/* Invite text preview */}
        <div style={{
          background: 'var(--gray-2)', borderRadius: 12, padding: 14, marginBottom: 16
        }}>
          <p style={{ fontSize: 14, color: 'var(--white)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {INVITE_TEXT}
          </p>
        </div>

        {/* Social proof */}
        <p style={{ fontSize: 12, color: 'var(--gray-4)', marginBottom: 16, textAlign: 'center' }}>
          Kairos helps improve decision timing through daily guidance
        </p>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleCopy} className="scale-tap" style={{
            flex: 1, padding: 14, background: 'var(--gray-2)', border: 'none',
            borderRadius: 12, color: '#fff', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit'
          }}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <button onClick={handleShare} className="scale-tap" style={{
            flex: 2, padding: 14, background: 'var(--yellow)', border: 'none',
            borderRadius: 12, color: '#000', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit'
          }}>
            Share Invite
          </button>
        </div>
      </div>
    </>
  )
}
