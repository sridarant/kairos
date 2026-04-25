import { useEffect, useState } from 'react'
import Logo from './Logo'

const PLANET_SYMBOL = {
  Sun: '☀️', Moon: '🌙', Mars: '♂️', Mercury: '☿',
  Jupiter: '♃', Venus: '♀️', Saturn: '♄'
}
const LUNAR_SYMBOL = {
  Waxing: '🌒', Full: '🌕', Waning: '🌘', Dark: '🌑'
}
const DAY_TYPE_SYMBOL = {
  Initiate: '⚡', Build: '🔨', Communicate: '💬', Reflect: '🔮', Restrict: '🛑'
}

function MemberCard({ member, delay }) {
  return (
    <div className="fade-in" style={{
      background: 'var(--gray-2)', borderRadius: 12, padding: 14,
      animationDelay: delay
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <p style={{ fontSize: 13, fontWeight: 600 }}>{member.name}</p>
        <p style={{ fontSize: 11, color: 'var(--yellow)', fontWeight: 600 }}>{member.golden_window}</p>
      </div>
      <p style={{ fontSize: 13, color: 'var(--gray-4)' }}>{member.summary}</p>
    </div>
  )
}

export default function HomeScreen({ daily, loading, primaryUser, onProfileOpen }) {
  const [version, setVersion] = useState(null)
  useEffect(() => {
    fetch('/version.json').then(r => r.json()).then(v => setVersion(v.version)).catch(() => {})
  }, [])

  const greeting = primaryUser?.name ? `Hey ${primaryUser.name.split(' ')[0]}` : 'Today'

  const header = (
    <div className="fade-in" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo />
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Kairos</h1>
        </div>
        <button onClick={onProfileOpen} className="scale-tap" style={{
          background: 'var(--gray-2)', border: 'none', borderRadius: 20,
          color: 'var(--gray-4)', fontSize: 13, padding: '6px 12px',
          cursor: 'pointer', fontFamily: 'inherit'
        }}>
          {primaryUser?.name ? `👤 ${primaryUser.name.split(' ')[0]}` : '+ Profile'}
        </button>
      </div>
      <p style={{ fontSize: 14, color: 'var(--gray-4)', marginTop: 4 }}>Know when to act</p>
    </div>
  )

  if (loading) {
    return (
      <div style={{ padding: 16, paddingTop: 56 }}>
        {header}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 64 }}>
          <span className="spinner" />
        </div>
      </div>
    )
  }

  if (!daily) return null

  const familyMembers = (daily.members || []).filter((_, i) => i > 0)

  return (
    <div style={{ padding: 16, paddingTop: 56 }}>
      {header}

      {/* Astro badges */}
      <div className="fade-in" style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {daily.planet && (
          <span style={{
            background: 'var(--gray-2)', borderRadius: 20, padding: '4px 10px',
            fontSize: 12, color: 'var(--gray-4)', display: 'inline-flex', alignItems: 'center', gap: 4
          }}>
            {PLANET_SYMBOL[daily.planet] || '✦'} {daily.planet}
          </span>
        )}
        {daily.lunar_phase && (
          <span style={{
            background: 'var(--gray-2)', borderRadius: 20, padding: '4px 10px',
            fontSize: 12, color: 'var(--gray-4)', display: 'inline-flex', alignItems: 'center', gap: 4
          }}>
            {LUNAR_SYMBOL[daily.lunar_phase] || '🌙'} {daily.lunar_phase}
          </span>
        )}
        {daily.day_type && (
          <span style={{
            background: 'var(--gray-2)', borderRadius: 20, padding: '4px 10px',
            fontSize: 12, color: 'var(--gray-4)', display: 'inline-flex', alignItems: 'center', gap: 4
          }}>
            {DAY_TYPE_SYMBOL[daily.day_type] || '◆'} {daily.day_type}
          </span>
        )}
      </div>

      {/* Golden window */}
      <div className="fade-in" style={{
        background: 'var(--yellow)', color: '#000',
        padding: '20px', borderRadius: 16, marginBottom: 16,
        animationDelay: '0.05s'
      }}>
        <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, opacity: 0.6 }}>
          {greeting} — Best Time Today
        </p>
        <p style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{daily.golden_window}</p>
      </div>

      {/* Cards */}
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

      {/* Family */}
      {familyMembers.length > 0 && (
        <div className="fade-in" style={{ marginTop: 24, animationDelay: '0.25s' }}>
          <p style={{ fontSize: 12, color: 'var(--gray-4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Family
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {familyMembers.map((m, i) => (
              <MemberCard key={i} member={m} delay={`${0.28 + i * 0.05}s`} />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="fade-in" style={{ marginTop: 24, animationDelay: '0.3s', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--gray-4)' }}>
          Confidence: {daily.confidence_summary}%
        </p>
        {version && (
          <p style={{ fontSize: 11, color: 'var(--gray-3)', marginTop: 4 }}>
            Kairos v{version}
          </p>
        )}
      </div>
    </div>
  )
}
