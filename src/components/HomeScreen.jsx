import { useEffect, useState, useCallback } from 'react'
import Logo from './Logo'
import { minsUntilWindow, addHistory, updateOutcome, trackFeedback, computeInsight, computeAnalytics } from '../lib/dataClient'

const PLANET_SYMBOL = { Sun:'☀️', Moon:'🌙', Mars:'♂️', Mercury:'☿', Jupiter:'♃', Venus:'♀️', Saturn:'♄' }

// ─── Confidence → trust indicator ─────────────────────────────────────────────
const TRUST = {
  High:       { icon:'🟢', label:'Strong Agreement',    color:'var(--green-txt)' },
  'Very High':{ icon:'🟢', label:'Strong Agreement',    color:'var(--green-txt)' },
  Medium:     { icon:'🟡', label:'Moderate Agreement',  color:'var(--amber-txt)' },
  Low:        { icon:'🔴', label:'Conflicting Signals', color:'var(--red-txt)'   }
}
function trust(confidence) { return TRUST[confidence] || TRUST.Medium }

// ─── Section 1: Greeting + Theme ─────────────────────────────────────────────
function GreetingSection({ primaryUser, daily }) {
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name     = primaryUser?.name?.split(' ')[0] || null
  const conf     = daily?.confidence_summary || daily?.confidence || 'Medium'
  const t        = trust(conf)
  const why      = daily?.why || null

  return (
    <div style={{ marginBottom:18 }}>
      <p style={{ fontSize:14, color:'var(--gray-4)', marginBottom:2 }}>
        {greeting}{name ? `, ${name}` : ''}
      </p>
      <h1 style={{ fontSize:24, fontWeight:700, marginBottom:4, lineHeight:1.2 }}>
        {daily?.focus || 'Decision Making'}
      </h1>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom: why ? 8 : 0 }}>
        <span style={{ fontSize:12 }}>{t.icon}</span>
        <span style={{ fontSize:12, color:t.color, fontWeight:600 }}>{t.label}</span>
      </div>
      {why && <p style={{ fontSize:13, color:'var(--gray-4)', lineHeight:1.5 }}>{why}</p>}
    </div>
  )
}

// ─── Section 2: Best Time card ────────────────────────────────────────────────
function BestTimeSection({ daily }) {
  const [mins, setMins] = useState(() => minsUntilWindow(daily?.golden_window))
  useEffect(() => {
    const t = setInterval(() => setMins(minsUntilWindow(daily?.golden_window)), 60000)
    return () => clearInterval(t)
  }, [daily?.golden_window])

  const why = daily?.nakshatra
    ? `${daily.nakshatra} ${daily.tithi_label ? `— ${daily.tithi_label}` : 'shapes today's clarity'}`
    : 'Planetary alignment supports this window'

  return (
    <div style={{ background:'var(--yellow)', color:'#000', borderRadius:16, padding:'16px 20px', marginBottom:12 }}>
      <p style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600, opacity:0.6, marginBottom:2 }}>
        Best Time Today
      </p>
      <p style={{ fontSize:28, fontWeight:800, marginBottom:4 }}>{daily?.golden_window}</p>
      <p style={{ fontSize:12, opacity:0.65, lineHeight:1.4 }}>{why}</p>
      {mins && (
        <p style={{ fontSize:12, marginTop:6, fontWeight:600 }}>
          ⏰ {mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h ${mins%60}m`} away
        </p>
      )}
    </div>
  )
}

// ─── Section 3: Signal Cards — RESPONSIVE GRID, no horizontal scroll ──────────
function SignalCards({ daily }) {
  const cards = [
    daily?.signal     || { icon:'🟡', label:'Signal',    text:'Loading…' },
    daily?.avoid_card || { icon:'🔴', label:'Avoid',     text:'Loading…' },
    daily?.watch_card || { icon:'🟡', label:'Watch',     text:'Loading…' }
  ]
  return (
    // 3-column grid — equal width, never scrolls horizontally
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:16 }}>
      {cards.map((c, i) => (
        <div key={i} style={{ background:'var(--gray-2)', borderRadius:12, padding:'10px 10px' }}>
          <p style={{ fontSize:15, marginBottom:3 }}>{c.icon}</p>
          <p style={{ fontSize:11, fontWeight:700, marginBottom:3, color:'#ddd' }}>{c.label}</p>
          <p style={{ fontSize:10, color:'var(--gray-4)', lineHeight:1.4 }}>{c.text}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Section 4: Astro context bar ─────────────────────────────────────────────
function AstroBar({ daily }) {
  if (!daily) return null
  const tags = [
    daily.planet    && { emoji: PLANET_SYMBOL[daily.planet] || '✦', text: daily.planet },
    daily.nakshatra && { emoji:'✨', text: daily.nakshatra },
    daily.tithi     && { emoji:'🌗', text: `Tithi ${daily.tithi}` }
  ].filter(Boolean)
  if (!tags.length) return null
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
      {tags.map((t, i) => (
        <span key={i} style={{ background:'var(--gray-2)', border:'1px solid var(--gray-3)', borderRadius:20,
          padding:'3px 9px', fontSize:11, color:'#bbb', display:'inline-flex', alignItems:'center', gap:3 }}>
          {t.emoji} {t.text}
        </span>
      ))}
    </div>
  )
}

// ─── Section 5: Recommendations ──────────────────────────────────────────────
const CONF_COLOR = { High:'var(--green-txt)', Medium:'var(--amber-txt)', Low:'var(--red-txt)' }

function RecommendationCard({ rec, onFeedback }) {
  const [open, setOpen]         = useState(false)
  const [fbDone, setFbDone]     = useState(false)
  const [validated, setValidated] = useState(null) // 'yes'|'no'|'skip'

  function handleFeedback(e, type) {
    e.stopPropagation()
    setFbDone(true)
    onFeedback?.(rec.category, rec.action, type)
  }
  function handleValidate(e, val) {
    e.stopPropagation()
    setValidated(val)
    onFeedback?.(rec.category, rec.action, val === 'yes' ? 'helpful' : val === 'no' ? 'not_helpful' : 'skipped')
  }

  const t = trust(rec.confidence)
  return (
    <div style={{ background:'var(--gray-2)', borderRadius:12, padding:'12px 14px', marginBottom:6 }}
         aria-label={`${rec.label} recommendation`}>
      {/* Header row — always visible */}
      <div onClick={() => setOpen(o => !o)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:18 }} aria-hidden="true">{rec.icon}</span>
          <span style={{ fontSize:13, fontWeight:600 }}>{rec.label}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:10, color:t.color, fontWeight:600 }}>{t.label}</span>
          <span style={{ fontSize:11, color:'var(--gray-4)' }} aria-hidden="true">{open ? '▴' : '▾'}</span>
        </div>
      </div>

      {/* Collapsed preview — one line always visible */}
      {!open && (
        <p style={{ fontSize:12, color:'var(--gray-4)', marginTop:4, lineHeight:1.4 }}>{rec.action}</p>
      )}

      {/* Expanded detail: What / Why / When */}
      {open && (
        <div className="fade-in" style={{ marginTop:10 }}>
          <p style={{ fontSize:13, color:'var(--white)', fontWeight:600, marginBottom:3 }}>What</p>
          <p style={{ fontSize:13, color:'var(--white)', marginBottom:8, lineHeight:1.5 }}>{rec.action}</p>
          <p style={{ fontSize:12, color:'var(--gray-4)', fontWeight:600, marginBottom:2 }}>Why</p>
          <p style={{ fontSize:12, color:'var(--gray-4)', marginBottom:8, lineHeight:1.5 }}>{rec.reason}</p>
          {rec.best_time && (
            <>
              <p style={{ fontSize:12, color:'var(--gray-4)', fontWeight:600, marginBottom:2 }}>When</p>
              <p style={{ fontSize:12, color:'var(--yellow)', marginBottom:10 }}>{rec.best_time}</p>
            </>
          )}

          {/* Validation + feedback row */}
          {!fbDone && !validated && (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <button onClick={e => handleValidate(e,'yes')} style={smallBtn('var(--green-bg)','var(--green-txt)')}>✓ Done</button>
              <button onClick={e => handleValidate(e,'no')}  style={smallBtn('var(--red-bg)','var(--red-txt)')}>✗ Skipped</button>
              <button onClick={e => handleFeedback(e,'not_helpful')} style={smallBtn('var(--gray-3)','var(--gray-4)')}>Not helpful</button>
            </div>
          )}
          {(fbDone || validated) && (
            <p style={{ fontSize:11, color:'var(--gray-4)' }}>
              {validated === 'yes' ? '✓ Noted — great decision.' : validated === 'no' ? '✓ Skipped — noted for learning.' : '✓ Thank you.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
function smallBtn(bg, color) {
  return { background:bg, border:'none', borderRadius:8, padding:'6px 10px', fontSize:11,
    color, cursor:'pointer', fontFamily:'inherit', fontWeight:600, minHeight:32 }
}

function PersonalDashboard({ primaryMember, onFeedback }) {
  const [showAll, setShowAll] = useState(false)
  const recs = primaryMember?.recommendations
  if (!recs) return null
  const top  = recs.top  || []
  const rest = recs.rest || []
  return (
    <div style={{ marginBottom:20 }}>
      <p style={{ fontSize:12, color:'var(--gray-4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
        Today's Guidance
      </p>
      {top.map((r, i) => <RecommendationCard key={i} rec={r} onFeedback={onFeedback} />)}
      {rest.length > 0 && (
        <>
          {showAll && rest.map((r, i) => <RecommendationCard key={`r${i}`} rec={r} onFeedback={onFeedback} />)}
          <button onClick={() => setShowAll(v => !v)} style={{
            width:'100%', background:'none', border:'1px solid var(--gray-3)', borderRadius:10,
            color:'var(--gray-4)', fontSize:12, padding:'10px', cursor:'pointer', fontFamily:'inherit', marginTop:4,
            minHeight:40
          }}>
            {showAll ? '▴ Show less' : `▾ ${rest.length} more areas`}
          </button>
        </>
      )}
    </div>
  )
}

// ─── Section 6: Family Today ──────────────────────────────────────────────────
function FamilyMemberCard({ member, isFirst }) {
  const [open, setOpen] = useState(false)
  const emoji = isFirst ? '🙂' : ['👩','👦','👧','👴','👵'][Math.abs((member.name?.charCodeAt(0)||0) % 5)]
  const conf  = trust(member.confidence || 'Medium')
  return (
    <div onClick={() => setOpen(o => !o)} style={{ background:'var(--gray-2)', borderRadius:12, padding:'12px 14px', cursor:'pointer', marginBottom:6 }}
         aria-label={`${member.name} — ${member.golden_window}`}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:20 }}>{emoji}</span>
          <div>
            <p style={{ fontSize:13, fontWeight:600 }}>{member.name}</p>
            <p style={{ fontSize:11, color:'var(--yellow)' }}>{member.golden_window}</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:10, color:conf.color }}>{conf.icon}</span>
          <span style={{ fontSize:11, color:'var(--gray-4)' }}>{open ? '▴' : '▾'}</span>
        </div>
      </div>
      {open && (
        <div className="fade-in" style={{ marginTop:10 }}>
          <p style={{ fontSize:12, color:'var(--gray-4)', lineHeight:1.5 }}>{member.summary || member.do_advice}</p>
          {member.focus && <p style={{ fontSize:11, color:'var(--yellow)', marginTop:4 }}>Focus: {member.focus}</p>}
        </div>
      )}
    </div>
  )
}

function FamilySection({ members, alignment, onFamilyPlan }) {
  if (!members || members.length < 2) return null
  const alignTrust = trust(alignment?.confidence || 'Medium')
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <p style={{ fontSize:12, color:'var(--gray-4)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Family Today</p>
        <button onClick={onFamilyPlan} style={{ background:'none', border:'1px solid var(--gray-3)', borderRadius:20,
          color:'var(--yellow)', fontSize:11, padding:'4px 10px', cursor:'pointer', fontFamily:'inherit', fontWeight:600, minHeight:30 }}>
          Plan Together
        </button>
      </div>
      {members.map((m, i) => <FamilyMemberCard key={i} member={m} isFirst={i===0} />)}
      {alignment && (
        <div style={{ background:'var(--gray-2)', borderRadius:12, padding:'12px 14px', marginTop:6 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
            <p style={{ fontSize:13, fontWeight:600 }}>Family Alignment</p>
            <span style={{ fontSize:11, color:alignTrust.color, fontWeight:600 }}>{alignTrust.icon} {alignment.confidence || 'Medium'}</span>
          </div>
          {alignment.best_shared_window && (
            <p style={{ fontSize:12, color:'var(--yellow)', fontWeight:600, marginBottom:4 }}>
              Best together: {alignment.best_shared_window}
            </p>
          )}
          {alignment.recommended?.length > 0 && (
            <p style={{ fontSize:12, color:'var(--gray-4)' }}>✓ {alignment.recommended.slice(0,3).join(' · ')}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Section 7: Timeline ──────────────────────────────────────────────────────
function TimelineSection({ timeline }) {
  if (!timeline?.length) return null
  const Q_COLOR = { Excellent:'var(--green-txt)', Good:'var(--yellow)', Moderate:'var(--amber-txt)', 'Low energy':'var(--red-txt)' }
  return (
    <div style={{ marginBottom:20 }}>
      <p style={{ fontSize:12, color:'var(--gray-4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
        Today's Timeline
      </p>
      <div style={{ position:'relative', paddingLeft:24 }}>
        <div style={{ position:'absolute', left:8, top:8, bottom:8, width:2, background:'var(--gray-3)', borderRadius:2 }} />
        {timeline.map((t, i) => (
          <div key={i} style={{ position:'relative', marginBottom:14 }}>
            <div style={{ position:'absolute', left:-20, top:3, width:10, height:10, borderRadius:'50%',
              background: Q_COLOR[t.quality] || 'var(--gray-3)', border:'2px solid var(--gray-1)' }} />
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
              <p style={{ fontSize:13, fontWeight:700, color: Q_COLOR[t.quality] || '#ccc' }}>
                {t.time}{t.end ? `–${t.end}` : ''}
              </p>
              {t.quality !== 'Moderate' && t.quality !== 'Low energy' && (
                <span style={{ fontSize:10, color:'var(--gray-4)', background:'var(--gray-2)', borderRadius:10, padding:'1px 6px' }}>
                  {t.quality}
                </span>
              )}
            </div>
            <p style={{ fontSize:12, color:'var(--gray-4)', lineHeight:1.4 }}>{t.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Section 8: Week Plan — VERTICAL GRID, no horizontal scroll ───────────────
function WeekSection({ weekPlan, onFetchFuture }) {
  if (!weekPlan?.length) return null
  const CONF_COLOR_W = { High:'var(--green-txt)', Medium:'var(--amber-txt)', Low:'var(--red-txt)' }
  const conf = (day) => {
    const c = day.confidence || 50
    return c >= 70 ? 'High' : c >= 45 ? 'Medium' : 'Low'
  }
  return (
    <div style={{ marginBottom:20 }}>
      <p style={{ fontSize:12, color:'var(--gray-4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
        Next 7 Days
      </p>
      {/* 2-column grid — never scrolls */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
        {weekPlan.map((d, i) => {
          const c = conf(d)
          return (
            <div key={i} onClick={() => d.days_ahead > 0 && onFetchFuture?.(d.days_ahead)}
              style={{ background:'var(--gray-2)', borderRadius:12, padding:'10px 12px',
                cursor: d.days_ahead > 0 ? 'pointer' : 'default',
                border: i === 0 ? '1px solid var(--gray-3)' : 'none' }}>
              <p style={{ fontSize:11, color: i===0 ? 'var(--yellow)' : 'var(--gray-4)', marginBottom:3, fontWeight: i===0 ? 700 : 400 }}>
                {d.label}
              </p>
              <p style={{ fontSize:12, color: CONF_COLOR_W[c], fontWeight:600, marginBottom:2 }}>{c}</p>
              <p style={{ fontSize:11, color:'var(--gray-4)', lineHeight:1.3 }}>{d.summary}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Pattern insight ──────────────────────────────────────────────────────────
function PatternInsight({ userData }) {
  const insight = computeInsight(userData?.history || [])
  if (!insight) return null
  return (
    <div style={{ background:'var(--gray-2)', borderRadius:12, padding:'11px 14px', marginBottom:14,
      display:'flex', gap:10, alignItems:'flex-start' }}>
      <span style={{ fontSize:15 }}>💡</span>
      <p style={{ fontSize:12, color:'var(--gray-4)', lineHeight:1.5 }}>{insight}</p>
    </div>
  )
}

// ─── Install banner ───────────────────────────────────────────────────────────
function InstallBanner({ onDismiss }) {
  function handleInstall() {
    window.__installPrompt?.prompt()
    window.__installPrompt?.userChoice?.then(() => { window.__installPrompt = null; onDismiss() })
  }
  return (
    <div style={{ background:'var(--gray-2)', borderRadius:12, padding:'11px 14px', marginBottom:12,
      display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:13, fontWeight:600, marginBottom:1 }}>Add Kairos to Home Screen</p>
        <p style={{ fontSize:11, color:'var(--gray-4)' }}>Daily guidance in one tap</p>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        <button onClick={handleInstall} style={{ background:'var(--yellow)', border:'none', borderRadius:10,
          padding:'7px 12px', fontSize:12, fontWeight:700, color:'#000', cursor:'pointer', fontFamily:'inherit', minHeight:32 }}>
          Install
        </button>
        <button onClick={onDismiss} aria-label="Dismiss" style={{ background:'none', border:'none',
          color:'var(--gray-4)', fontSize:18, cursor:'pointer', padding:'0 4px', minHeight:32 }}>✕</button>
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function HomeScreen({ daily, loading, primaryUser, users, userData, onProfileOpen, onInvite, onInsights, onFamilyPlan, onFetchFuture, onFeedback }) {
  const [version, setVersion]         = useState(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    fetch('/version.json').then(r => r.json()).then(v => setVersion(v.version)).catch(() => {})
    const h = () => setShowInstall(true)
    window.addEventListener('installable', h)
    return () => window.removeEventListener('installable', h)
  }, [])

  const header = (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, paddingTop:4 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Logo /><span style={{ fontSize:17, fontWeight:700 }}>Kairos</span>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        <button onClick={onProfileOpen} aria-label="Profile" style={{ background:'var(--gray-2)', border:'none', borderRadius:20,
          color:'var(--gray-4)', fontSize:12, padding:'6px 12px', cursor:'pointer', fontFamily:'inherit', minHeight:32 }}>
          {primaryUser?.name ? `👤 ${primaryUser.name.split(' ')[0]}` : '+ Me'}
        </button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div style={{ padding:'16px 16px 0', paddingTop:'calc(16px + env(safe-area-inset-top,0px))' }}>
        {header}
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:280 }}>
          <span className="spinner" />
        </div>
      </div>
    )
  }

  const primaryMember = daily?.members?.[0] || null
  const familyMembers = (daily?.members || []).filter((_, i) => i > 0)

  return (
    <div style={{ padding:'16px 16px 0', paddingTop:'calc(16px + env(safe-area-inset-top,0px))' }}>
      {header}
      {showInstall && <InstallBanner onDismiss={() => setShowInstall(false)} />}

      <GreetingSection primaryUser={primaryUser} daily={daily} />
      <AstroBar daily={daily} />
      <BestTimeSection daily={daily} />
      <SignalCards daily={daily} />
      <PatternInsight userData={userData} />
      <PersonalDashboard primaryMember={primaryMember} onFeedback={onFeedback} />
      {familyMembers.length > 0 && (
        <FamilySection members={[daily?.members?.[0], ...familyMembers]} alignment={daily?.family_alignment} onFamilyPlan={onFamilyPlan} />
      )}
      <TimelineSection timeline={primaryMember?.timeline} />
      <WeekSection weekPlan={daily?.week_plan} onFetchFuture={onFetchFuture} />

      <div style={{ textAlign:'center', padding:'16px 0 8px', borderTop:'1px solid var(--gray-3)' }}>
        <button onClick={onInsights} style={{ background:'none', border:'none', color:'var(--gray-4)',
          fontSize:12, cursor:'pointer', fontFamily:'inherit', minHeight:32, padding:'4px 12px' }}>
          View Insights →
        </button>
        {version && <p style={{ fontSize:10, color:'var(--gray-3)', marginTop:4 }}>Kairos v{version}</p>}
      </div>
    </div>
  )
}
