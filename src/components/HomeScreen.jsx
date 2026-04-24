import Logo from './Logo'

export default function HomeScreen({ daily, loading }) {
  if (loading) {
    return (
      <div style={{ padding: 16, paddingTop: 56 }}>
        <div className="fade-in" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Logo />
            <h1 style={{ fontSize: 20, fontWeight: 600 }}>Kairos</h1>
          </div>
          <p style={{ fontSize: 14, color: 'var(--gray-4)', marginTop: 4 }}>Know when to act</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 64 }}>
          <span className="spinner" />
        </div>
      </div>
    )
  }

  if (!daily) return null

  return (
    <div style={{ padding: 16, paddingTop: 56 }}>

      <div className="fade-in" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo />
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Kairos</h1>
        </div>
        <p style={{ fontSize: 14, color: 'var(--gray-4)', marginTop: 4 }}>Know when to act</p>
      </div>

      <div className="fade-in" style={{
        background: 'var(--yellow)', color: '#000',
        padding: '20px', borderRadius: 16, marginBottom: 16,
        animationDelay: '0.05s'
      }}>
        <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, opacity: 0.6 }}>
          Best Time Today
        </p>
        <p style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{daily.golden_window}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        <div className="scale-tap fade-in" style={{ background: 'var(--green-bg)', padding: 16, borderRadius: 12, animationDelay: '0.1s' }}>
          <p style={{ fontSize: 12, color: 'var(--green-txt)', marginBottom: 6 }}>🟢 DO</p>
          <p style={{ fontSize: 15 }}>{daily.do}</p>
        </div>

        <div className="scale-tap fade-in" style={{ background: 'var(--red-bg)', padding: 16, borderRadius: 12, animationDelay: '0.15s' }}>
          <p style={{ fontSize: 12, color: 'var(--red-txt)', marginBottom: 6 }}>🔴 AVOID</p>
          <p style={{ fontSize: 15 }}>{daily.avoid}</p>
        </div>

        <div className="scale-tap fade-in" style={{ background: 'var(--amber-bg)', padding: 16, borderRadius: 12, animationDelay: '0.2s' }}>
          <p style={{ fontSize: 12, color: 'var(--amber-txt)', marginBottom: 6 }}>⚠️ WATCH</p>
          <p style={{ fontSize: 15 }}>{daily.watch}</p>
        </div>

      </div>

      <p className="fade-in" style={{ fontSize: 12, color: 'var(--gray-4)', textAlign: 'center', marginTop: 24, animationDelay: '0.25s' }}>
        Confidence: {daily.confidence_summary}%
      </p>

    </div>
  )
}
