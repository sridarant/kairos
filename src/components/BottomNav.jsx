export default function BottomNav({ onAsk, onProfile }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%',
      transform: 'translateX(-50%)',
      width: '100%', maxWidth: 448,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid var(--gray-2)',
      padding: '12px 16px 28px',
      display: 'flex', gap: 8,
      zIndex: 30
    }}>
      <button onClick={onProfile} className="scale-tap" style={{
        flex: 1, padding: '12px 0',
        background: 'var(--gray-2)', border: 'none', borderRadius: 12,
        color: 'var(--white)', fontSize: 14, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit'
      }}>👤</button>
      <button onClick={onAsk} className="scale-tap" style={{
        flex: 3, padding: '12px 0',
        background: 'var(--yellow)', border: 'none', borderRadius: 12,
        color: '#000', fontSize: 15, fontWeight: 700,
        cursor: 'pointer', fontFamily: 'inherit'
      }}>+ Ask Kairos</button>
    </div>
  )
}
