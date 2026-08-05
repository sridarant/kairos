import { useEffect, useState, useMemo, lazy, Suspense } from 'react'
import Logo from './Logo'
import { minsUntilWindow, computeInsight, computeAnalytics } from '../lib/dataClient'
import { buildMorningBrief } from '../../lib/dailyBrief/index.js'

const PLANET_SYMBOL = { Sun:'☀️', Moon:'🌙', Mars:'♂️', Mercury:'☿', Jupiter:'♃', Venus:'♀️', Saturn:'♄' }

const TRUST = {
  'Very High': { icon:'🟢', label:'Strong Agreement',    color:'var(--green-txt)' },
  High:        { icon:'🟢', label:'Strong Agreement',    color:'var(--green-txt)' },
  Medium:      { icon:'🟡', label:'Moderate Agreement',  color:'var(--amber-txt)' },
  Low:         { icon:'🔴', label:'Conflicting Signals', color:'var(--red-txt)'   }
}
const OUTLOOK_STYLE = {
  Positive:    { bg:'var(--green-bg)',  color:'var(--green-txt)',  label:'Positive' },
  Neutral:     { bg:'var(--gray-2)',    color:'var(--gray-4)',     label:'Neutral'  },
  Challenging: { bg:'var(--red-bg)',    color:'var(--red-txt)',    label:'Challenging' }
}

function trust(c) { return TRUST[c] || TRUST.Medium }

// ─── Morning Brief (primary above-the-fold card) ──────────────────────────────
function MorningBrief({ brief, userName, onFetchFuture }) {
  const [expanded, setExpanded] = useState(false)
  if (!brief) return null

  const outlook = OUTLOOK_STYLE[brief.outlook] || OUTLOOK_STYLE.Neutral
  const t = trust(brief.confidence)
  const [mins, setMins] = useState(() => minsUntilWindow(brief.bestWindow))
  useEffect(() => {
    const timer = setInterval(() => setMins(minsUntilWindow(brief.bestWindow)), 60000)
    return () => clearInterval(timer)
  }, [brief.bestWindow])

  return (
    <div style={{ background:'var(--gray-2)', borderRadius:16, padding:'16px 16px', marginBottom:14 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div>
          <p style={{ fontSize:11, color:'var(--gray-4)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:3 }}>
            Today's Theme
          </p>
          <h2 style={{ fontSize:22, fontWeight:800, marginBottom:0, lineHeight:1.1 }}>{brief.theme}</h2>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:outlook.bg,
            borderRadius:20, padding:'4px 10px', marginBottom:4 }}>
            <span style={{ fontSize:11, color:outlook.color, fontWeight:700 }}>{outlook.label}</span>
          </div>
          <p style={{ fontSize:10, color:t.color }}>{t.icon} {t.label}</p>
        </div>
      </div>

      {/* Best window — always visible */}
      <div style={{ background:'var(--yellow)', borderRadius:12, padding:'10px 14px', marginBottom:10, color:'#000' }}>
        <p style={{ fontSize:10, fontWeight:600, opacity:0.6, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:2 }}>
          Best Window{mins ? ` · ${mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h ${mins%60}m`} away` : ''}
        </p>
        <p style={{ fontSize:22, fontWeight:800 }}>{brief.bestWindow}</p>
      </div>

      {/* Decision of the Day */}
      {brief.decisionOfDay && (
        <div style={{ marginBottom:10 }}>
          <p style={{ fontSize:11, color:'var(--gray-4)', fontWeight:600, marginBottom:3, textTransform:'uppercase', letterSpacing:'0.06em' }}>
            Decision of the Day
          </p>
          <p style={{ fontSize:13, color:'var(--white)', lineHeight:1.5 }}>{brief.decisionOfDay}</p>
        </div>
      )}

      {/* Watch For */}
      {brief.watchFor && (
        <div style={{ marginBottom: expanded ? 10 : 0 }}>
          <p style={{ fontSize:11, color:'var(--amber-txt)', fontWeight:600, marginBottom:2, textTransform:'uppercase', letterSpacing:'0.06em' }}>
            Watch For
          </p>
          <p style={{ fontSize:12, color:'var(--gray-4)', lineHeight:1.4 }}>{brief.watchFor}</p>
        </div>
      )}

      {/* Expandable: Opportunities, Cautions, Family */}
      {expanded && (
        <div className="fade-in" style={{ marginTop:10 }}>
          {brief.opportunities?.length > 0 && (
            <div style={{ marginBottom:10 }}>
              <p style={{ fontSize:11, color:'var(--green-txt)', fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                Opportunities
              </p>
              {brief.opportunities.map((o, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:16, flexShrink:0 }}>{o.icon}</span>
                  <div>
                    <p style={{ fontSize:12, fontWeight:600, color:'var(--white)', marginBottom:1 }}>{o.label}</p>
                    <p style={{ fontSize:11, color:'var(--gray-4)', lineHeight:1.4 }}>{o.advice}</p>
                    {o.bestTime && <p style={{ fontSize:10, color:'var(--yellow)', marginTop:1 }}>{o.bestTime}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {brief.cautions?.length > 0 && (
            <div style={{ marginBottom:10 }}>
              <p style={{ fontSize:11, color:'var(--red-txt)', fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                Cautions
              </p>
              {brief.cautions.map((c, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:16, flexShrink:0 }}>{c.icon}</span>
                  <div>
                    <p style={{ fontSize:12, fontWeight:600, color:'var(--white)', marginBottom:1 }}>{c.label}</p>
                    <p style={{ fontSize:11, color:'var(--gray-4)', lineHeight:1.4 }}>{c.advice}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {brief.familyBrief && (
            <div style={{ background:'var(--gray-1)', borderRadius:10, padding:'10px 12px', marginBottom:10 }}>
              <p style={{ fontSize:11, color:'var(--gray-4)', fontWeight:700, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                Family Today
              </p>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:12, color:'var(--white)' }}>Energy</span>
                <span style={{ fontSize:12, color: brief.familyBrief.energy === 'High' ? 'var(--green-txt)' : 'var(--amber-txt)', fontWeight:600 }}>
                  {brief.familyBrief.energy}
                </span>
              </div>
              {brief.familyBrief.bestWindow && (
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, color:'var(--gray-4)' }}>Best together</span>
                  <span style={{ fontSize:12, color:'var(--yellow)', fontWeight:600 }}>{brief.familyBrief.bestWindow}</span>
                </div>
              )}
              {brief.familyBrief.activities?.length > 0 && (
                <p style={{ fontSize:11, color:'var(--gray-4)', marginTop:2 }}>
                  ✓ {brief.familyBrief.activities.join(' · ')}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Expand toggle */}
      <button onClick={() => setExpanded(v => !v)} style={{
        width:'100%', background:'none', border:'none', color:'var(--gray-4)', fontSize:12,
        cursor:'pointer', fontFamily:'inherit', padding:'8px 0 0', textAlign:'center', minHeight:32
      }} aria-label={expanded ? 'Show less' : 'Show more'}>
        {expanded ? '▴ Less' : '▾ Full brief'}
      </button>
    </div>
  )
}

// ─── Tomorrow Preview ─────────────────────────────────────────────────────────
function TomorrowPreview({ preview, onFetchFuture }) {
  if (!preview) return null
  const STARS = Array.from({length:5},(_,i) => <span key={i} style={{opacity: i < preview.stars ? 1 : 0.2}}>★</span>)
  const t = trust(preview.confidence)
  return (
    <div onClick={() => onFetchFuture?.(1)} style={{ background:'var(--gray-2)', borderRadius:12,
      padding:'11px 14px', marginBottom:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between' }}
      role="button" aria-label="View tomorrow's guidance">
      <div>
        <p style={{ fontSize:11, color:'var(--gray-4)', marginBottom:3, textTransform:'uppercase', letterSpacing:'0.06em' }}>Tomorrow</p>
        <p style={{ fontSize:13, color:'var(--white)', lineHeight:1.4 }}>{preview.summary}</p>
      </div>
      <div style={{ textAlign:'right', flexShrink:0, marginLeft:12 }}>
        <div style={{ fontSize:12, color:t.color, marginBottom:2 }}>{STARS}</div>
        <p style={{ fontSize:10, color:t.color }}>{t.label}</p>
      </div>
    </div>
  )
}

// ─── Signal Cards — responsive 3-column grid (NO horizontal scroll) ───────────
function SignalCards({ daily }) {
  const cards = [
    daily?.signal     || { icon:'🟡', label:'Signal', text:'Loading…' },
    daily?.avoid_card || { icon:'🔴', label:'Avoid',  text:'Loading…' },
    daily?.watch_card || { icon:'🟡', label:'Watch',  text:'Loading…' }
  ]
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:14 }}>
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

// ─── Recommendation card (What / Why / When + feedback) ──────────────────────
function RecommendationCard({ rec, onFeedback }) {
  const [open, setOpen]   = useState(false)
  const [done, setDone]   = useState(null)
  const t = trust(rec.confidence)

  function handleAction(e, val) {
    e.stopPropagation()
    setDone(val)
    onFeedback?.(rec.category, rec.action, val)
  }

  return (
    <div style={{ background:'var(--gray-2)', borderRadius:12, padding:'12px 14px', marginBottom:6 }}
         aria-label={`${rec.label} recommendation`}>
      <div onClick={() => setOpen(o => !o)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:18 }}>{rec.icon}</span>
          <span style={{ fontSize:13, fontWeight:600 }}>{rec.label}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:10, color:t.color, fontWeight:600 }}>{t.label}</span>
          <span style={{ fontSize:11, color:'var(--gray-4)' }}>{open ? '▴' : '▾'}</span>
        </div>
      </div>
      {!open && <p style={{ fontSize:12, color:'var(--gray-4)', marginTop:4, lineHeight:1.4 }}>{rec.action}</p>}
      {open && (
        <div className="fade-in" style={{ marginTop:10 }}>
          <p style={{ fontSize:11, color:'var(--gray-4)', fontWeight:600, marginBottom:2 }}>What</p>
          <p style={{ fontSize:13, color:'var(--white)', marginBottom:8, lineHeight:1.5 }}>{rec.action}</p>
          <p style={{ fontSize:11, color:'var(--gray-4)', fontWeight:600, marginBottom:2 }}>Why</p>
          <p style={{ fontSize:12, color:'var(--gray-4)', marginBottom:8, lineHeight:1.5 }}>{rec.reason}</p>
          {rec.best_time && (
            <>
              <p style={{ fontSize:11, color:'var(--gray-4)', fontWeight:600, marginBottom:2 }}>When</p>
              <p style={{ fontSize:12, color:'var(--yellow)', marginBottom:10 }}>{rec.best_time}</p>
            </>
          )}
          {!done ? (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {[['helpful','✓ Done'],['not_helpful','✗ Skip'],['skipped','Not relevant']].map(([val, label]) => (
                <button key={val} onClick={e => handleAction(e, val)} style={{
                  background:'var(--gray-3)', border:'none', borderRadius:8, padding:'6px 10px',
                  fontSize:11, color:'var(--gray-4)', cursor:'pointer', fontFamily:'inherit', fontWeight:600, minHeight:32
                }}>{label}</button>
              ))}
            </div>
          ) : (
            <p style={{ fontSize:11, color:'var(--gray-4)' }}>✓ Recorded — thank you.</p>
          )}
        </div>
      )}
    </div>
  )
}

function PersonalDashboard({ primaryMember, onFeedback }) {
  const [showAll, setShowAll] = useState(false)
  const recs = primaryMember?.recommendations
  if (!recs?.top?.length) return null
  const top = recs.top, rest = recs.rest || []
  return (
    <div style={{ marginBottom:18 }}>
      <p style={{ fontSize:12, color:'var(--gray-4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>
        Today's Guidance
      </p>
      {top.map((r, i) => <RecommendationCard key={i} rec={r} onFeedback={onFeedback} />)}
      {rest.length > 0 && (
        <>
          {showAll && rest.map((r, i) => <RecommendationCard key={`r${i}`} rec={r} onFeedback={onFeedback} />)}
          <button onClick={() => setShowAll(v => !v)} style={{
            width:'100%', background:'none', border:'1px solid var(--gray-3)', borderRadius:10,
            color:'var(--gray-4)', fontSize:12, padding:'10px', cursor:'pointer', fontFamily:'inherit', marginTop:4, minHeight:40
          }}>{showAll ? '▴ Show less' : `▾ ${rest.length} more areas`}</button>
        </>
      )}
    </div>
  )
}

// ─── Family Today ─────────────────────────────────────────────────────────────
function FamilyMemberCard({ member, isFirst }) {
  const [open, setOpen] = useState(false)
  const emoji = isFirst ? '🙂' : ['👩','👦','👧','👴','👵'][Math.abs((member.name?.charCodeAt(0)||0) % 5)]
  const t = trust(member.confidence || 'Medium')
  return (
    <div onClick={() => setOpen(o => !o)} style={{ background:'var(--gray-2)', borderRadius:12, padding:'12px 14px', cursor:'pointer', marginBottom:6 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:20 }}>{emoji}</span>
          <div>
            <p style={{ fontSize:13, fontWeight:600 }}>{member.name}</p>
            <p style={{ fontSize:11, color:'var(--yellow)' }}>{member.golden_window}</p>
          </div>
        </div>
        <span style={{ fontSize:10, color:t.color }}>{t.icon}</span>
      </div>
      {open && (
        <div className="fade-in" style={{ marginTop:8 }}>
          <p style={{ fontSize:12, color:'var(--gray-4)', lineHeight:1.5 }}>{member.summary || member.do_advice}</p>
          {member.focus && <p style={{ fontSize:11, color:'var(--yellow)', marginTop:4 }}>Focus: {member.focus}</p>}
        </div>
      )}
    </div>
  )
}

function FamilySection({ members, alignment, onFamilyPlan }) {
  if (!members || members.length < 2) return null
  const t = trust(alignment?.confidence || 'Medium')
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <p style={{ fontSize:12, color:'var(--gray-4)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Family Today</p>
        <button onClick={onFamilyPlan} style={{ background:'none', border:'1px solid var(--gray-3)', borderRadius:20,
          color:'var(--yellow)', fontSize:11, padding:'4px 10px', cursor:'pointer', fontFamily:'inherit', fontWeight:600, minHeight:30 }}>
          Plan Together
        </button>
      </div>
      {members.map((m, i) => <FamilyMemberCard key={i} member={m} isFirst={i===0} />)}
      {alignment && (
        <div style={{ background:'var(--gray-2)', borderRadius:12, padding:'11px 14px', marginTop:4 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
            <p style={{ fontSize:13, fontWeight:600 }}>Family Alignment</p>
            <span style={{ fontSize:10, color:t.color }}>{t.icon} {alignment.confidence || 'Medium'}</span>
          </div>
          {alignment.best_shared_window && (
            <p style={{ fontSize:12, color:'var(--yellow)', fontWeight:600, marginBottom:3 }}>Best together: {alignment.best_shared_window}</p>
          )}
          {alignment.recommended?.length > 0 && (
            <p style={{ fontSize:11, color:'var(--gray-4)' }}>✓ {alignment.recommended.slice(0,3).join(' · ')}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
function TimelineSection({ timeline }) {
  if (!timeline?.length) return null
  const QC = { Excellent:'var(--green-txt)', Good:'var(--yellow)', Moderate:'var(--amber-txt)', 'Low energy':'var(--red-txt)' }
  return (
    <div style={{ marginBottom:18 }}>
      <p style={{ fontSize:12, color:'var(--gray-4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Today's Timeline</p>
      <div style={{ position:'relative', paddingLeft:22 }}>
        <div style={{ position:'absolute', left:7, top:6, bottom:6, width:2, background:'var(--gray-3)', borderRadius:2 }} />
        {timeline.map((t, i) => (
          <div key={i} style={{ position:'relative', marginBottom:12 }}>
            <div style={{ position:'absolute', left:-18, top:3, width:9, height:9, borderRadius:'50%',
              background: QC[t.quality] || 'var(--gray-3)', border:'2px solid var(--gray-1)' }} />
            <p style={{ fontSize:12, fontWeight:700, color: QC[t.quality] || '#ccc', marginBottom:1 }}>
              {t.time}{t.end ? `–${t.end}` : ''}
            </p>
            <p style={{ fontSize:11, color:'var(--gray-4)', lineHeight:1.4 }}>{t.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Week Plan — 2-col grid (NO horizontal scroll) ───────────────────────────
function WeekSection({ weekPlan, onFetchFuture }) {
  if (!weekPlan?.length) return null
  const CC = { High:'var(--green-txt)', Medium:'var(--amber-txt)', Low:'var(--red-txt)' }
  const conf = s => s >= 70 ? 'High' : s >= 45 ? 'Medium' : 'Low'
  return (
    <div style={{ marginBottom:18 }}>
      <p style={{ fontSize:12, color:'var(--gray-4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Next 7 Days</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
        {weekPlan.map((d, i) => {
          const c = conf(d.confidence || 50)
          return (
            <div key={i} onClick={() => d.days_ahead > 0 && onFetchFuture?.(d.days_ahead)}
              style={{ background:'var(--gray-2)', borderRadius:12, padding:'10px 12px',
                cursor: d.days_ahead > 0 ? 'pointer' : 'default',
                border: i === 0 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
              <p style={{ fontSize:11, color: i===0 ? 'var(--yellow)' : 'var(--gray-4)', marginBottom:2, fontWeight: i===0 ? 700 : 400 }}>
                {d.label}
              </p>
              <p style={{ fontSize:12, color:CC[c], fontWeight:600, marginBottom:2 }}>{c}</p>
              <p style={{ fontSize:10, color:'var(--gray-4)', lineHeight:1.3 }}>{d.summary}</p>
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
    <div style={{ background:'var(--gray-2)', borderRadius:12, padding:'10px 14px', marginBottom:14, display:'flex', gap:10 }}>
      <span style={{ fontSize:14 }}>💡</span>
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
    <div style={{ background:'var(--gray-2)', borderRadius:12, padding:'11px 14px', marginBottom:12, display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:13, fontWeight:600, marginBottom:1 }}>Add Kairos to Home Screen</p>
        <p style={{ fontSize:11, color:'var(--gray-4)' }}>Daily guidance in one tap</p>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        <button onClick={handleInstall} style={{ background:'var(--yellow)', border:'none', borderRadius:10,
          padding:'7px 12px', fontSize:12, fontWeight:700, color:'#000', cursor:'pointer', fontFamily:'inherit', minHeight:32 }}>Install</button>
        <button onClick={onDismiss} aria-label="Dismiss" style={{ background:'none', border:'none', color:'var(--gray-4)', fontSize:18, cursor:'pointer', padding:'0 4px', minHeight:32 }}>✕</button>
      </div>
    </div>
  )
}

// ─── Astro pill bar ───────────────────────────────────────────────────────────
function AstroBar({ daily }) {
  if (!daily) return null
  const tags = [
    daily.planet    && { emoji: PLANET_SYMBOL[daily.planet] || '✦', text: daily.planet },
    daily.nakshatra && { emoji:'✨', text: daily.nakshatra },
    daily.tithi     && { emoji:'🌗', text: `Tithi ${daily.tithi}` }
  ].filter(Boolean)
  if (!tags.length) return null
  return (
    <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
      {tags.map((t, i) => (
        <span key={i} style={{ background:'var(--gray-2)', border:'1px solid var(--gray-3)', borderRadius:20,
          padding:'3px 9px', fontSize:11, color:'#bbb', display:'inline-flex', alignItems:'center', gap:3 }}>
          {t.emoji} {t.text}
        </span>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HomeScreen({ daily, loading, primaryUser, users, userData, onProfileOpen, onInvite, onInsights, onFamilyPlan, onFetchFuture, onFeedback }) {
  const [version, setVersion]         = useState(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    fetch('/version.json').then(r => r.json()).then(v => setVersion(v.version)).catch(() => {})
    const h = () => setShowInstall(true)
    window.addEventListener('installable', h)
    return () => window.removeEventListener('installable', h)
  }, [])

  // Build morning brief from daily response (memoised — only recomputes when daily changes)
  const brief = useMemo(() => {
    if (!daily) return null
    const primaryMember = daily.members?.[0] || null
    return buildMorningBrief(daily, primaryMember)
  }, [daily])

  const header = (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Logo /><span style={{ fontSize:17, fontWeight:700 }}>Kairos</span>
      </div>
      <button onClick={onProfileOpen} aria-label="Profile" style={{ background:'var(--gray-2)', border:'none', borderRadius:20,
        color:'var(--gray-4)', fontSize:12, padding:'6px 12px', cursor:'pointer', fontFamily:'inherit', minHeight:32 }}>
        {primaryUser?.name ? `👤 ${primaryUser.name.split(' ')[0]}` : '+ Me'}
      </button>
    </div>
  )

  if (loading) {
    return (
      <div style={{ padding:'16px 16px 0', paddingTop:'calc(16px + env(safe-area-inset-top,0px))' }}>
        {header}
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:260 }}>
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

      {/* PRIMARY: Morning Brief — renders first */}
      <MorningBrief brief={brief} userName={primaryUser?.name?.split(' ')[0]} onFetchFuture={onFetchFuture} />

      {/* Tomorrow preview */}
      {brief?.tomorrowPreview && (
        <TomorrowPreview preview={brief.tomorrowPreview} onFetchFuture={onFetchFuture} />
      )}

      {/* Astro context */}
      <AstroBar daily={daily} />

      {/* Pattern insight (only when history exists) */}
      <PatternInsight userData={userData} />

      {/* Signal cards */}
      <SignalCards daily={daily} />

      {/* Secondary: recommendations, family, timeline, week */}
      <PersonalDashboard primaryMember={primaryMember} onFeedback={onFeedback} />
      {familyMembers.length > 0 && (
        <FamilySection members={[primaryMember, ...familyMembers]} alignment={daily?.family_alignment} onFamilyPlan={onFamilyPlan} />
      )}
      <TimelineSection timeline={primaryMember?.timeline} />
      <WeekSection weekPlan={daily?.week_plan} onFetchFuture={onFetchFuture} />

      <div style={{ textAlign:'center', padding:'14px 0 8px', borderTop:'1px solid var(--gray-3)' }}>
        <button onClick={onInsights} style={{ background:'none', border:'none', color:'var(--gray-4)',
          fontSize:12, cursor:'pointer', fontFamily:'inherit', minHeight:32, padding:'4px 12px' }}>
          View Insights →
        </button>
        {version && <p style={{ fontSize:10, color:'var(--gray-3)', marginTop:4 }}>Kairos v{version}</p>}
      </div>
    </div>
  )
}
