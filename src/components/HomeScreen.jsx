import { useEffect, useState } from 'react'
import Logo from './Logo'
import { loadHistory, computeInsight, minsUntilWindow } from '../lib/history'
import { getAnalytics } from '../lib/analytics'

const PLANET_SYMBOL = {
  Sun: '☀️', Moon: '🌙', Mars: '♂️', Mercury: '☿',
  Jupiter: '♃', Venus: '♀️', Saturn: '♄'
}
const LUNAR_LABEL = {
  Waxing: 'Light', Full: 'Full', Waning: 'Fading', Dark: 'Dark'
}

const FOCUS_MAP = {
  communication: 'Conversations',
  decision:      'Decisions',
  focus:         'Deep Work',
  risk:          'Caution',
  default:       'Reflection'
}

const OUTCOME_ICON   = { success: '✅', fail: '❌' }
const DECISION_LABEL = { do: 'DO', avoid: 'AVOID', wait: 'WAIT' }

// Signal strength from confidence number
function signalStrength(confidence) {
  if (!confidence && confidence !== 0) return null
  if (confidence >= 70) return { icon: '🟢', label: 'Strong signal' }
  if (confidence >= 45) return { icon: '🟡', label: 'Moderate signal' }
  return { icon: '🔴', label: 'Weak signal' }
}

// Dynamic tag explanation line
function buildTagLine(planet, lunarPhase, nakshatra, tithi, dominant) {
  const parts = []
  if (planet) {
    const influence = {
      Sun: 'drives decisions', Moon: 'heightens intuition', Mars: 'fuels bold action',
      Mercury: 'sharpens communication', Jupiter: 'expands clarity', Venus: 'eases dialogue', Saturn: 'demands patience'
    }
    parts.push(`${planet} ${influence[planet] || 'shapes the day'}`)
  }
  if (nakshatra) parts.push(`${nakshatra} adds its character`)
  if (tithi) {
    const phase = tithi <= 5 ? 'an opening phase' : tithi <= 15 ? 'a peak phase' : tithi <= 20 ? 'a declining phase' : 'a closure phase'
    parts.push(`Tithi ${tithi} marks ${phase}`)
  }
  if (parts.length === 0) return null
  return parts.join(', ') + '.'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TopSection({ dominant, planet, lunarPhase, nakshatra, tithi }) {
  const focusLabel  = FOCUS_MAP[dominant] || FOCUS_MAP.default
  const planetEmoji = PLANET_SYMBOL[planet] || '✦'
  const phaseLabel  = LUNAR_LABEL[lunarPhase] || lunarPhase || 'Phase'
  const tagLine     = buildTagLine(planet, lunarPhase, nakshatra, tithi, dominant)

  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 11, color: 'var(--gray-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        Today's Focus
      </p>
      <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--white)', lineHeight: 1.1, marginBottom: 12 }}>
        {focusLabel}
      </p>

      {/* Exactly 4 tags: Planet, Phase, Nakshatra, Tithi */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: tagLine ? 10 : 0 }}>
        {planet && (
          <span style={{ background: 'var(--gray-2)', border: '1px solid var(--gray-3)', borderRadius: 20,
            padding: '5px 11px', fontSize: 13, color: '#ccc', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {planetEmoji} {planet}
          </span>
        )}
        {lunarPhase && (
          <span style={{ background: 'var(--gray-2)', border: '1px solid var(--gray-3)', borderRadius: 20,
            padding: '5px 11px', fontSize: 13, color: '#ccc' }}>
            🌙 {phaseLabel}
          </span>
        )}
        {nakshatra && (
          <span style={{ background: 'var(--gray-2)', border: '1px solid var(--gray-3)', borderRadius: 20,
            padding: '5px 11px', fontSize: 13, color: '#ccc' }}>
            ✨ {nakshatra}
          </span>
        )}
        {tithi && (
          <span style={{ background: 'var(--gray-2)', border: '1px solid var(--gray-3)', borderRadius: 20,
            padding: '5px 11px', fontSize: 13, color: '#ccc' }}>
            🌗 Tithi {tithi}
          </span>
        )}
      </div>

      {/* Tag explanation line */}
      {tagLine && (
        <p style={{ fontSize: 12, color: 'var(--gray-4)', lineHeight: 1.5 }}>{tagLine}</p>
      )}
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
  const h = Math.floor(mins / 60), rem = mins % 60
  const label = h > 0 ? `${h}h ${rem}m` : `${mins} min${mins !== 1 ? 's' : ''}`
  return (
    <div style={{ background: 'var(--gray-2)', borderRadius: 12, padding: '9px 14px',
      marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 13 }}>⏰</span>
      <p style={{ fontSize: 13, color: 'var(--white)' }}>
        Next best window in <span style={{ color: 'var(--yellow)', fontWeight: 700 }}>{label}</span>
      </p>
    </div>
  )
}

function Collapsible({ label, emoji, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginTop: 10 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', background: 'none', border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 0', cursor: 'pointer', color: 'var(--gray-4)', fontFamily: 'inherit'
      }}>
        <span style={{ fontSize: 13 }}>{emoji} {label}</span>
        <span style={{ fontSize: 12, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>
      {open && <div className="fade-in">{children}</div>}
    </div>
  )
}

function MemberRow({ member, primaryWindow }) {
  const [expanded, setExpanded] = useState(false)
  const aligns = member.golden_window === primaryWindow
  return (
    <div style={{ background: 'var(--gray-2)', borderRadius: 12, padding: 12, marginBottom: 6 }}>
      <div onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
        <p style={{ fontSize: 13, fontWeight: 600 }}>{member.name}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--yellow)', fontWeight: 600 }}>{member.golden_window}</p>
          <span style={{ fontSize: 11, color: 'var(--gray-4)' }}>▾</span>
        </div>
      </div>
      {expanded && (
        <div className="fade-in" style={{ marginTop: 8 }}>
          <p style={{ fontSize: 12, color: aligns ? 'var(--green-txt)' : 'var(--amber-txt)', marginBottom: 4 }}>
            {aligns ? '✓ Timing aligns with yours' : 'Different peak window'}
          </p>
          <p style={{ fontSize: 13, color: 'var(--gray-4)' }}>{member.summary}</p>
        </div>
      )}
    </div>
  )
}

function DecisionTimeline({ history }) {
  const recent = history.slice(0, 5)
  if (recent.length === 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
      {recent.map(e => (
        <div key={e.id} style={{ background: 'var(--gray-2)', borderRadius: 10, padding: '9px 12px',
          display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--gray-4)', minWidth: 38 }}>
            {DECISION_LABEL[e.decision] || e.decision}
          </span>
          <p style={{ fontSize: 13, color: 'var(--white)', flex: 1, overflow: 'hidden',
            whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {e.question}
          </p>
          {e.outcome && <span style={{ fontSize: 14, flexShrink: 0 }}>{OUTCOME_ICON[e.outcome]}</span>}
        </div>
      ))}
    </div>
  )
}

function PremiumSection() {
  const items = [
    { icon: '📊', label: 'Weekly Analysis',     sub: 'Your patterns across 7 days' },
    { icon: '🌀', label: 'Life Phase Deep Dive', sub: 'Long-cycle Dasha mapping' },
    { icon: '🧠', label: 'Advanced Insights',    sub: 'AI-powered decision coaching' }
  ]
  return (
    <div style={{ marginTop: 4 }}>
      {items.map(item => (
        <div key={item.label} style={{ background: 'var(--gray-2)', borderRadius: 12, padding: '11px 14px',
          display: 'flex', alignItems: 'center', gap: 12, opacity: 0.55, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>{item.icon}</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</p>
            <p style={{ fontSize: 12, color: 'var(--gray-4)' }}>{item.sub}</p>
          </div>
          <span style={{ fontSize: 11, color: 'var(--gray-4)' }}>Unlock →</span>
        </div>
      ))}
      <p style={{ fontSize: 11, color: 'var(--gray-4)', textAlign: 'center', marginTop: 8 }}>
        Kairos helps improve decision timing through daily guidance
      </p>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HomeScreen({ daily, loading, primaryUser, onProfileOpen, onInvite }) {
  const [version, setVersion]     = useState(null)
  const [history, setHistory]     = useState([])
  const [analytics, setAnalytics] = useState({ actionRateDisplay: null })

  useEffect(() => {
    fetch('/version.json').then(r => r.json()).then(v => setVersion(v.version)).catch(() => {})
    setHistory(loadHistory())
    setAnalytics(getAnalytics())
  }, [])

  const insight   = computeInsight(history)
  const dominant  = daily?.members?.[0]?._reasoning?.dominant || 'default'
  const planet    = daily?.planet      || null
  const lunarPhase = daily?.lunar_phase || null
  const nakshatra = daily?.nakshatra   || null
  const tithi     = daily?.tithi       || null
  const signal    = signalStrength(daily?.confidence_summary)

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Logo />
        <span style={{ fontSize: 17, fontWeight: 600 }}>Kairos</span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onInvite} className="scale-tap" style={{
          background: 'none', border: '1px solid var(--gray-3)', borderRadius: 20,
          color: 'var(--yellow)', fontSize: 12, padding: '5px 10px',
          cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600
        }}>Invite</button>
        <button onClick={onProfileOpen} className="scale-tap" style={{
          background: 'var(--gray-2)', border: 'none', borderRadius: 20,
          color: 'var(--gray-4)', fontSize: 12, padding: '5px 10px',
          cursor: 'pointer', fontFamily: 'inherit'
        }}>
          {primaryUser?.name ? `👤 ${primaryUser.name.split(' ')[0]}` : '+ Me'}
        </button>
      </div>
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

      {/* ABOVE THE FOLD */}
      <TopSection dominant={dominant} planet={planet} lunarPhase={lunarPhase} nakshatra={nakshatra} tithi={tithi} />
      <WindowTrigger goldenWindow={daily.golden_window} />

      {/* Golden window */}
      <div style={{ background: 'var(--yellow)', color: '#000',
        padding: '18px 20px', borderRadius: 16, marginBottom: 14 }}>
        <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, opacity: 0.6 }}>
          Best Time Today
        </p>
        <p style={{ fontSize: 24, fontWeight: 700, marginTop: 3 }}>{daily.golden_window}</p>
      </div>

      {/* DO — always visible */}
      <div className="scale-tap" style={{ background: 'var(--green-bg)', padding: 16, borderRadius: 12, marginBottom: 2 }}>
        <p style={{ fontSize: 12, color: 'var(--green-txt)', marginBottom: 6 }}>🟢 DO</p>
        <p style={{ fontSize: 15 }}>{daily.do}</p>
      </div>

      {/* Signal strength — below main insight, subtle */}
      {signal && (
        <p style={{ fontSize: 12, color: 'var(--gray-4)', marginTop: 10, marginBottom: 2 }}>
          {signal.icon} {signal.label}
        </p>
      )}

      {/* Collapsibles */}
      <Collapsible label="Avoid" emoji="🔴">
        <div style={{ background: 'var(--red-bg)', padding: 14, borderRadius: 12 }}>
          <p style={{ fontSize: 14 }}>{daily.avoid}</p>
        </div>
      </Collapsible>

      <Collapsible label="Watch" emoji="⚠️">
        <div style={{ background: 'var(--amber-bg)', padding: 14, borderRadius: 12 }}>
          <p style={{ fontSize: 14 }}>{daily.watch}</p>
        </div>
      </Collapsible>

      {familyMembers.length > 0 && (
        <Collapsible label="Family" emoji="👥">
          {familyMembers.map((m, i) => (
            <MemberRow key={i} member={m} primaryWindow={daily.golden_window} />
          ))}
        </Collapsible>
      )}

      <Collapsible label="Insights" emoji="💡">
        {insight && (
          <div style={{ background: 'var(--gray-2)', borderRadius: 12, padding: 14, marginBottom: 8 }}>
            <p style={{ fontSize: 13, color: 'var(--gray-4)', lineHeight: 1.5 }}>{insight}</p>
          </div>
        )}
        {analytics.actionRateDisplay && (
          <div style={{ background: 'var(--gray-2)', borderRadius: 12, padding: 14, marginBottom: 8 }}>
            <p style={{ fontSize: 13, color: 'var(--gray-4)' }}>
              You act on Kairos advice{' '}
              <span style={{ color: 'var(--white)', fontWeight: 700 }}>{analytics.actionRateDisplay}</span>
              {' '}of the time.
            </p>
          </div>
        )}
        <DecisionTimeline history={history} />
      </Collapsible>

      <Collapsible label="Coming Soon" emoji="🔒">
        <PremiumSection />
      </Collapsible>

      {/* Footer — version only, no confidence % */}
      <div style={{ marginTop: 24, paddingBottom: 8, textAlign: 'center' }}>
        {version && (
          <p style={{ fontSize: 11, color: 'var(--gray-3)' }}>Kairos v{version}</p>
        )}
      </div>
    </div>
  )
}
