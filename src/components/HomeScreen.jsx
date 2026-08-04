import { useEffect, useState } from 'react'
import Logo from './Logo'
import { minsUntilWindow } from '../lib/dataClient'

const PLANET_SYMBOL = { Sun:'☀️', Moon:'🌙', Mars:'♂️', Mercury:'☿', Jupiter:'♃', Venus:'♀️', Saturn:'♄' }

function Stars({ count, size = 14 }) {
  return (
    <span style={{ fontSize: size, letterSpacing: 1 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ opacity: i < count ? 1 : 0.2 }}>★</span>
      ))}
    </span>
  )
}

// ─── Section 1: Greeting + Rating ─────────────────────────────────────────────
function GreetingSection({ primaryUser, daily }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name = primaryUser?.name?.split(' ')[0] || null

  return (
    <div style={{ marginBottom: 20 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        {greeting}{name ? `, ${name}` : ''}
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Stars count={daily?.stars || 3} size={18} />
        {daily?.focus && (
          <span style={{ fontSize: 13, color: 'var(--yellow)', fontWeight: 600 }}>
            {daily.focus}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Section 2: Best Time ─────────────────────────────────────────────────────
function BestTimeSection({ daily }) {
  const [mins, setMins] = useState(() => minsUntilWindow(daily?.golden_window))
  useEffect(() => {
    const t = setInterval(() => setMins(minsUntilWindow(daily?.golden_window)), 60000)
    return () => clearInterval(t)
  }, [daily?.golden_window])

  const why = daily?.nakshatra
    ? `${daily.nakshatra} nakshatra ${daily.tithi_label ? `during ${daily.tithi_label}` : 'sharpens clarity'}`
    : 'Planetary alignment favours this window'

  return (
    <div style={{ background:'var(--yellow)', color:'#000', borderRadius:16, padding:'18px 20px', marginBottom:14 }}>
      <p style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600, opacity:0.6, marginBottom:4 }}>
        Best Time Today
      </p>
      <p style={{ fontSize:26, fontWeight:800, marginBottom:6 }}>{daily?.golden_window}</p>
      <p style={{ fontSize:12, opacity:0.7, lineHeight:1.4 }}>{why}</p>
      {mins && (
        <p style={{ fontSize:12, marginTop:6, fontWeight:600 }}>⏰ Starts in {mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h ${mins%60}m`}</p>
      )}
    </div>
  )
}

// ─── Section 3: Signal Cards (horizontal, always visible) ─────────────────────
function SignalCards({ daily }) {
  const cards = [
    daily?.signal    || { icon:'🟡', label:'Signal',  text:'Loading…' },
    daily?.avoid_card || { icon:'🔴', label:'Avoid',   text:'Loading…' },
    daily?.watch_card || { icon:'🟡', label:'Watch',   text:'Loading…' }
  ]
  return (
    <div style={{ display:'flex', gap:8, marginBottom:16, overflowX:'auto', paddingBottom:2 }}>
      {cards.map((c, i) => (
        <div key={i} style={{
          flex:'0 0 auto', width:140, background:'var(--gray-2)', borderRadius:12, padding:'12px 12px'
        }}>
          <p style={{ fontSize:16, marginBottom:4 }}>{c.icon}</p>
          <p style={{ fontSize:12, fontWeight:700, marginBottom:4, color:'#ddd' }}>{c.label}</p>
          <p style={{ fontSize:11, color:'var(--gray-4)', lineHeight:1.4 }}>{c.text}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Section 4: Personal Dashboard ───────────────────────────────────────────
function RecommendationCard({ rec }) {
  const [open, setOpen] = useState(false)
  const confColor = { High:'var(--green-txt)', Medium:'var(--amber-txt)', Low:'var(--red-txt)' }[rec.confidence] || 'var(--gray-4)'
  return (
    <div onClick={() => setOpen(o => !o)} style={{
      background:'var(--gray-2)', borderRadius:12, padding:'12px 14px', cursor:'pointer', marginBottom:6
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:18 }}>{rec.icon}</span>
          <span style={{ fontSize:13, fontWeight:600 }}>{rec.label}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <Stars count={rec.stars || 3} size={12} />
          <span style={{ fontSize:10, color:confColor, fontWeight:600 }}>{rec.confidence}</span>
          <span style={{ fontSize:11, color:'var(--gray-4)' }}>{open ? '▴' : '▾'}</span>
        </div>
      </div>
      {open && (
        <div className="fade-in" style={{ marginTop:10 }}>
          <p style={{ fontSize:13, color:'var(--white)', marginBottom:4, fontWeight:600 }}>{rec.action}</p>
          <p style={{ fontSize:12, color:'var(--gray-4)', marginBottom:4, lineHeight:1.5 }}>{rec.reason}</p>
          {rec.best_time && (
            <p style={{ fontSize:11, color:'var(--yellow)' }}>Best time: {rec.best_time}</p>
          )}
        </div>
      )}
    </div>
  )
}

function PersonalDashboard({ primaryMember }) {
  const [showAll, setShowAll] = useState(false)
  const recs = primaryMember?.recommendations
  if (!recs) return null
  const top  = recs.top || []
  const rest = recs.rest || []
  return (
    <div style={{ marginBottom:20 }}>
      <p style={{ fontSize:12, color:'var(--gray-4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
        Today's Guidance
      </p>
      {top.map((r, i) => <RecommendationCard key={i} rec={r} />)}
      {rest.length > 0 && (
        <>
          {showAll && rest.map((r, i) => <RecommendationCard key={i} rec={r} />)}
          <button onClick={() => setShowAll(v => !v)} style={{
            width:'100%', background:'none', border:'1px solid var(--gray-3)', borderRadius:10,
            color:'var(--gray-4)', fontSize:12, padding:'8px', cursor:'pointer', fontFamily:'inherit', marginTop:4
          }}>{showAll ? '▴ Show less' : `▾ ${rest.length} more areas`}</button>
        </>
      )}
    </div>
  )
}

// ─── Section 5: Family Today ──────────────────────────────────────────────────
function FamilyMemberCard({ member, isFirst }) {
  const [open, setOpen] = useState(false)
  const emoji = isFirst ? '🙂' : ['👩','👦','👧','👴','👵'][Math.abs(member.name?.charCodeAt(0) || 0) % 5]
  return (
    <div onClick={() => setOpen(o => !o)} style={{
      background:'var(--gray-2)', borderRadius:12, padding:'12px 14px', cursor:'pointer', marginBottom:6
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:20 }}>{emoji}</span>
          <div>
            <p style={{ fontSize:13, fontWeight:600 }}>{member.name}</p>
            <p style={{ fontSize:11, color:'var(--yellow)' }}>{member.golden_window}</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <Stars count={member.stars || 3} size={12} />
          <span style={{ fontSize:11, color:'var(--gray-4)' }}>{open ? '▴' : '▾'}</span>
        </div>
      </div>
      {open && (
        <div className="fade-in" style={{ marginTop:10 }}>
          <p style={{ fontSize:12, color:'var(--gray-4)', marginBottom:6, lineHeight:1.4 }}>{member.summary || member.do_advice}</p>
          {member.focus && <p style={{ fontSize:11, color:'var(--yellow)' }}>Focus: {member.focus}</p>}
        </div>
      )}
    </div>
  )
}

function FamilySection({ members, alignment, onFamilyPlan }) {
  if (!members || members.length < 2) return null
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <p style={{ fontSize:12, color:'var(--gray-4)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Family Today</p>
        <button onClick={onFamilyPlan} style={{
          background:'none', border:'1px solid var(--gray-3)', borderRadius:20,
          color:'var(--yellow)', fontSize:11, padding:'4px 10px', cursor:'pointer', fontFamily:'inherit', fontWeight:600
        }}>Plan Together</button>
      </div>
      {members.map((m, i) => <FamilyMemberCard key={i} member={m} isFirst={i===0} />)}
      {alignment && (
        <div style={{ background:'var(--gray-2)', borderRadius:12, padding:'12px 14px', marginTop:8 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
            <p style={{ fontSize:13, fontWeight:600 }}>Family Alignment</p>
            <Stars count={alignment.stars} size={13} />
          </div>
          <p style={{ fontSize:12, color:'var(--gray-4)', marginBottom:6 }}>Harmony: {alignment.harmony_pct}%</p>
          {alignment.best_shared_window && (
            <p style={{ fontSize:12, color:'var(--yellow)', fontWeight:600, marginBottom:6 }}>
              Best shared window: {alignment.best_shared_window}
            </p>
          )}
          <p style={{ fontSize:11, color:'var(--gray-4)' }}>✓ {alignment.recommended?.join(' · ')}</p>
        </div>
      )}
    </div>
  )
}

// ─── Section 6: Timeline ──────────────────────────────────────────────────────
function TimelineSection({ timeline }) {
  if (!timeline?.length) return null
  const qualityColor = { Excellent:'var(--green-txt)', Good:'var(--yellow)', Moderate:'var(--amber-txt)', 'Low energy':'var(--red-txt)' }
  return (
    <div style={{ marginBottom:20 }}>
      <p style={{ fontSize:12, color:'var(--gray-4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
        Today's Timeline
      </p>
      <div style={{ position:'relative', paddingLeft:24 }}>
        {/* vertical line */}
        <div style={{ position:'absolute', left:8, top:8, bottom:8, width:2, background:'var(--gray-3)', borderRadius:2 }} />
        {timeline.map((t, i) => (
          <div key={i} style={{ position:'relative', marginBottom:16 }}>
            {/* dot */}
            <div style={{
              position:'absolute', left:-20, top:3, width:10, height:10, borderRadius:'50%',
              background: qualityColor[t.quality] || 'var(--gray-3)',
              border:'2px solid var(--gray-1)'
            }} />
            <p style={{ fontSize:13, fontWeight:700, color:qualityColor[t.quality] || '#ccc' }}>{t.time}</p>
            <p style={{ fontSize:12, color:'var(--gray-4)', lineHeight:1.4 }}>{t.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Section 7: Week Plan ─────────────────────────────────────────────────────
function WeekSection({ weekPlan, onFetchFuture }) {
  if (!weekPlan?.length) return null
  return (
    <div style={{ marginBottom:20 }}>
      <p style={{ fontSize:12, color:'var(--gray-4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
        Next 7 Days
      </p>
      <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
        {weekPlan.map((d, i) => (
          <div key={i} onClick={() => onFetchFuture?.(d.days_ahead)} style={{
            flex:'0 0 auto', width:80, background:'var(--gray-2)', borderRadius:12, padding:10,
            cursor: d.days_ahead > 0 ? 'pointer' : 'default', textAlign:'center'
          }}>
            <p style={{ fontSize:11, color:'var(--gray-4)', marginBottom:4 }}>{d.label}</p>
            <Stars count={d.stars} size={11} />
            <p style={{ fontSize:10, color:'var(--gray-4)', marginTop:4, lineHeight:1.3 }}>{d.summary}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Astro tag bar ────────────────────────────────────────────────────────────
function AstroBar({ daily }) {
  if (!daily) return null
  const tags = [
    daily.planet   && { emoji: PLANET_SYMBOL[daily.planet] || '✦', text: daily.planet },
    daily.lunar_phase && { emoji:'🌙', text: daily.lunar_phase === 'Full' ? 'Full Moon' : daily.lunar_phase },
    daily.nakshatra && { emoji:'✨', text: daily.nakshatra },
    daily.tithi    && { emoji:'🌗', text: `Tithi ${daily.tithi}` }
  ].filter(Boolean)

  const tagLine = [
    daily.planet   && `${daily.planet} ${({ Sun:'drives decisions', Moon:'heightens focus', Mars:'fuels action', Mercury:'sharpens communication', Jupiter:'expands clarity', Venus:'eases dialogue', Saturn:'demands patience' }[daily.planet] || '')}`,
    daily.nakshatra && `${daily.nakshatra} adds its energy`,
    daily.tithi_label && daily.tithi_label
  ].filter(Boolean).slice(0,2).join('; ')

  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:tagLine ? 6 : 0 }}>
        {tags.map((t, i) => (
          <span key={i} style={{ background:'var(--gray-2)', border:'1px solid var(--gray-3)', borderRadius:20,
            padding:'4px 10px', fontSize:12, color:'#bbb', display:'inline-flex', alignItems:'center', gap:4 }}>
            {t.emoji} {t.text}
          </span>
        ))}
      </div>
      {tagLine && <p style={{ fontSize:11, color:'var(--gray-4)' }}>{tagLine}.</p>}
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
    <div style={{ background:'var(--gray-2)', borderRadius:12, padding:'12px 14px', marginBottom:12,
      display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>Add Kairos to Home Screen</p>
        <p style={{ fontSize:11, color:'var(--gray-4)' }}>Daily guidance in one tap</p>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        <button onClick={handleInstall} style={{ background:'var(--yellow)', border:'none', borderRadius:10,
          padding:'7px 12px', fontSize:12, fontWeight:700, color:'#000', cursor:'pointer', fontFamily:'inherit' }}>Install</button>
        <button onClick={onDismiss} style={{ background:'none', border:'none', color:'var(--gray-4)',
          fontSize:16, cursor:'pointer', padding:'0 4px' }}>✕</button>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HomeScreen({ daily, loading, primaryUser, users, userData, onProfileOpen, onInvite, onInsights, onFamilyPlan, onFetchFuture }) {
  const [version, setVersion]         = useState(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    fetch('/version.json').then(r => r.json()).then(v => setVersion(v.version)).catch(() => {})
    const h = () => setShowInstall(true)
    window.addEventListener('installable', h)
    return () => window.removeEventListener('installable', h)
  }, [])

  const header = (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, paddingTop:8 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Logo /><span style={{ fontSize:17, fontWeight:700 }}>Kairos</span>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        <button onClick={onInvite} style={{ background:'none', border:'1px solid var(--gray-3)', borderRadius:20,
          color:'var(--yellow)', fontSize:12, padding:'5px 10px', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
          Share
        </button>
        <button onClick={onProfileOpen} style={{ background:'var(--gray-2)', border:'none', borderRadius:20,
          color:'var(--gray-4)', fontSize:12, padding:'5px 10px', cursor:'pointer', fontFamily:'inherit' }}>
          {primaryUser?.name ? `👤 ${primaryUser.name.split(' ')[0]}` : '+ Me'}
        </button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div style={{ padding:'16px 16px 0' }}>
        {header}
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:300 }}>
          <span className="spinner" />
        </div>
      </div>
    )
  }

  const primaryMember = daily?.members?.[0] || null
  const familyMembers = daily?.members || []

  return (
    <div style={{ padding:'16px 16px 0', paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}>
      {header}

      {showInstall && <InstallBanner onDismiss={() => setShowInstall(false)} />}

      <GreetingSection primaryUser={primaryUser} daily={daily} />
      <AstroBar daily={daily} />
      <BestTimeSection daily={daily} />
      <SignalCards daily={daily} />
      <PersonalDashboard primaryMember={primaryMember} />
      <FamilySection members={familyMembers} alignment={daily?.family_alignment} onFamilyPlan={onFamilyPlan} />
      <TimelineSection timeline={primaryMember?.timeline} />
      <WeekSection weekPlan={daily?.week_plan} onFetchFuture={onFetchFuture} />

      <div style={{ textAlign:'center', paddingBottom:8, borderTop:'1px solid var(--gray-3)', paddingTop:16 }}>
        <button onClick={onInsights} style={{ background:'none', border:'none', color:'var(--gray-4)',
          fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
          View Insights →
        </button>
        {version && <p style={{ fontSize:10, color:'var(--gray-3)', marginTop:4 }}>Kairos v{version}</p>}
      </div>
    </div>
  )
}
