import { useEffect, useState } from 'react'
import Logo from './Logo'
import { loadHistory, computeInsight, minsUntilWindow } from '../lib/history'

const PLANET_SYMBOL = {
  Sun: '☀️', Moon: '🌙', Mars: '♂️', Mercury: '☿',
  Jupiter: '♃', Venus: '♀️', Saturn: '♄'
}
const LUNAR_SYMBOL = {
  Waxing: '🌒', Full: '🌕', Waning: '🌘', Dark: '🌑'
}
const FOCUS_MAP = {
  communication: 'Conversations',
  decision:      'Decisions',
  focus:         'Deep Work',
  risk:          'Caution'
}
const OUTCOME_ICON = { success: '✅', fail: '❌' }
const DECISION_LABEL = { do: 'DO', avoid: 'AVOID', wait: 'WAIT' }

function MemberCard({ member, delay }) {
  return (
    <div className="fade-in" style={{
      background: 'var(--gray-2)', borderRadius: 12, padding: 14, animationDelay: delay
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <p style={{ fontSize: 13, fontWeight: 600 }}>{member.name}</p>
        <p style={{ fontSize: 11, color: 'var(--yellow)', fontWeight: 600 }}>{member.golden_window}</p>
      </div>
      <p style={{ fontSize: 13, color: 'var(--gray-4)' }}>{member.summary}</p>
    </div>
  )
}

function TodayFocus({ dominant }) {
  const label = FOCUS_MAP[dominant] || 'Decisions'
  return (
    <div className="fade-in" style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: 'var(--gray-2)', borderRadius: 12, padding: '10px 14px',
      marginBottom: 12
    }}>
      <span style={{ fontSize: 12, color: 'var(--gray-4)' }}>TODAY'S FOCUS</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--yellow)', marginLeft: 'auto' }}>{label}</span>
    </div>
  )
}

function WindowTrigger({ goldenWindow }) {
  const [mins, setMins] = useState(() => minsUntilWindow(goldenWindow))

  useEffect(() => {
    const t = setInterval(() => setMins(minsUntilWindow(goldenWindow)), 60000)
    return () => clearInterval(t)
  }, [goldenWindow])

  if (!mins) return null

  const hours = Math.floor(mins / 60)
  const rem   = mins % 60
  const label = hours > 0
    ? `${hours}h ${rem}m`
    : `${mins} min${mins !== 1 ? 's' : ''}`

  return (
    <div className="fade-in" style={{
      background: 'var(--gray-2)', borderRadius: 12, padding: '10px 14px',
      marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6
    }}>
      <span style={{ fontSize: 13 }}>⏰</span>
      <p style={{ fontSize: 13, color: 'var(--white)' }}>
        Your next best window starts in <span style={{ color: 'var(--yellow)', fontWeight: 700 }}>{label}</span>
      </p>
    </div>
  )
}

function DecisionTimeline({ history }) {
  const recent = history.slice(0, 5)
  if (recent.length === 0) return null
  return (
    <div className="fade-in" style={{ marginTop: 24 }}>
      <p style={{ fontSize: 12, color: 'var(--gray-4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Recent Decisions
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {recent.map(e => (
          <div key={e.id} style={{
            background: 'var(--gray-2)', borderRadius: 10, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span style={{ fontSize: 11, color: 'var(--gray-4)', minWidth: 40 }}>
              {DECISION_LABEL[e.decision] || e.decision}
            </span>
            <p style={{ fontSize: 13, color: 'var(--white)', flex: 1, overflow: 'hidden',
              whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {e.question}
            </p>
            {e.outcome && (
              <span style={{ fontSize: 14, flexShrink: 0 }}>{OUTCOME_ICON[e.outcome]}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function InsightCard({ insight }) {
  if (!insight) return null
  return (
    <div className="fade-in" style={{
      background: 'var(--gray-2)', borderRadius: 12, padding: '12px 14px',
      marginTop: 16, display: 'flex', gap: 10, alignItems: 'flex-start'
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
      <p style={{ fontSize: 13, color: 'var(--gray-4)', lineHeight: 1.5 }}>{insight}</p>
    </div>
  )
}

export default function HomeScreen({ daily, loading, primaryUser, onProfileOpen }) {
  const [version, setVersion] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    fetch('/version.json').then(r => r.json()).then(v => setVersion(v.version)).catch(() => {})
    setHistory(loadHistory())
  }, [])

  const greeting = primaryUser?.name ? `Hey ${primaryUser.name.split(' ')[0]}` : 'Today'
  const insight  = computeInsight(history)

  // Derive dominant dimension from primary member's _reasoning if available
  const dominant = daily?.members?.[0]?._reasoning?.dominant || null

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

      {/* Today's Focus */}
      {dominant && <TodayFocus dominant={dominant} />}

      {/* Window Trigger */}
      <WindowTrigger goldenWindow={daily.golden_window} />

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
        {daily.nakshatra && (
          <span style={{
            background: 'var(--gray-2)', borderRadius: 20, padding: '4px 10px',
            fontSize: 12, color: 'var(--gray-4)', display: 'inline-flex', alignItems: 'center', gap: 4
          }}>
            ✦ {daily.nakshatra}
          </span>
        )}
        {daily.tithi && (
          <span style={{
            background: 'var(--gray-2)', borderRadius: 20, padding: '4px 10px',
            fontSize: 12, color: 'var(--gray-4)', display: 'inline-flex', alignItems: 'center', gap: 4
          }}>
            🌗 Tithi {daily.tithi}
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

      {/* Insight card */}
      <InsightCard insight={insight} />

      {/* Decision timeline */}
      <DecisionTimeline history={history} />

      {/* Family */}
      {familyMembers.length > 0 && (
        <div className="fade-in" style={{ marginTop: 24 }}>
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
      <div className="fade-in" style={{ marginTop: 24, textAlign: 'center' }}>
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
