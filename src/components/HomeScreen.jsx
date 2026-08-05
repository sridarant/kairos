/**
 * HomeScreen v27.1 — Decision Command Center
 *
 * Information hierarchy (visual reading order):
 *   Morning Brief → Best Window → Decision of the Day →
 *   Today's Opportunities → Today's Cautions →
 *   Family Today → Timeline → Tomorrow → Next 7 Days
 *
 * Rules enforced here:
 *   - No horizontal scrolling anywhere
 *   - No competing visual priorities
 *   - Every card answers: What / Why / When
 *   - All engines remain upstream — zero business logic here
 */

import { useEffect, useState } from 'react'
import Logo from './Logo'
import { minsUntilWindow } from '../lib/dataClient'

// ─── Shared primitives ────────────────────────────────────────────────────────

const CONF_COLOR  = { High:'#4ade80', Medium:'#facc15', Low:'#f87171' }
const QUALITY_DOT = { Excellent:'#4ade80', Good:'#facc15', Moderate:'#fb923c', 'Low energy':'#f87171' }

const CAT_ICON = {
  career:'💼', finance:'💰', money:'💰', relationships:'❤️', health:'🌿',
  learning:'📚', travel:'✈️', spiritual:'🛕', home:'🏠', family:'👨‍👩‍👧',
  shopping:'🛍️', medical:'🏥', communication:'💬', business:'🏢',
  property:'🏠', legal:'⚖️', planning:'📋', education:'📚'
}

function stars(n = 3, size = 13) {
  return (
    <span style={{ fontSize:size, letterSpacing:1, lineHeight:1 }} aria-label={`${n} out of 5 stars`}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ opacity: i <= n ? 1 : 0.18 }}>★</span>
      ))}
    </span>
  )
}

function confBadge(confidence, size = 11) {
  const c = CONF_COLOR[confidence] || CONF_COLOR.Medium
  return (
    <span style={{ fontSize:size, color:c, fontWeight:700 }}>{confidence || 'Medium'}</span>
  )
}

// ─── Section: Header ──────────────────────────────────────────────────────────

function Header({ primaryUser, onProfileOpen, onInvite }) {
  return (
    <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
      paddingTop:'calc(12px + env(safe-area-inset-top,0px))', paddingBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Logo />
        <span style={{ fontSize:17, fontWeight:700, letterSpacing:'-0.01em' }}>Kairos</span>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        <button onClick={onInvite} aria-label="Share Kairos" style={ghostBtn()}>Share</button>
        <button onClick={onProfileOpen} aria-label="Profile" style={ghostBtn()}>
          {primaryUser?.name ? `👤 ${primaryUser.name.split(' ')[0]}` : '+ Me'}
        </button>
      </div>
    </header>
  )
}

// ─── Section 1: Morning Brief (hero) ─────────────────────────────────────────

function MorningBrief({ daily, primaryUser }) {
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name     = primaryUser?.name?.split(' ')[0] || null
  const conf     = daily?.confidence_summary || 'Medium'
  const theme    = daily?.focus || "Today's Theme"
  const summary  = daily?.why  || "Planetary alignment shapes today’s energy."
  const dayStars = daily?.members?.[0]?.stars || daily?.stars || 3

  // Outlook label from stars
  const outlookLabel = dayStars >= 5 ? 'Excellent Day' : dayStars >= 4 ? 'Positive Day'
    : dayStars >= 3 ? 'Balanced Day' : dayStars >= 2 ? 'Challenging Day' : 'Rest Day'

  return (
    <section aria-label="Morning Brief" style={{
      background:'var(--gray-2)', borderRadius:16, padding:'18px 18px 16px', marginBottom:12
    }}>
      <p style={{ fontSize:13, color:'var(--gray-4)', marginBottom:2 }}>
        {greeting}{name ? `, ${name}` : ''}
      </p>
      <p style={{ fontSize:11, color:'var(--gray-4)', textTransform:'uppercase',
        letterSpacing:'0.07em', marginBottom:6 }}>Today's Outlook</p>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <div>
          {stars(dayStars, 18)}
          <span style={{ fontSize:15, fontWeight:700, marginLeft:8, verticalAlign:'middle' }}>
            {outlookLabel}
          </span>
        </div>
        {confBadge(conf, 12)}
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:10 }}>
        <div>
          <p style={{ fontSize:10, color:'var(--gray-4)', textTransform:'uppercase',
            letterSpacing:'0.06em', marginBottom:2 }}>Today's Theme</p>
          <p style={{ fontSize:14, fontWeight:600 }}>{theme}</p>
        </div>
        <div>
          <p style={{ fontSize:10, color:'var(--gray-4)', textTransform:'uppercase',
            letterSpacing:'0.06em', marginBottom:2 }}>Confidence</p>
          {confBadge(conf, 14)}
        </div>
      </div>

      <p style={{ fontSize:13, color:'var(--gray-4)', lineHeight:1.55, borderTop:'1px solid var(--gray-3)',
        paddingTop:10, margin:0 }}>{summary}</p>
    </section>
  )
}

// ─── Section 2: Best Window ───────────────────────────────────────────────────

function BestWindow({ daily }) {
  const [mins, setMins] = useState(() => minsUntilWindow(daily?.golden_window))
  useEffect(() => {
    const t = setInterval(() => setMins(minsUntilWindow(daily?.golden_window)), 60000)
    return () => clearInterval(t)
  }, [daily?.golden_window])

  const doCard = daily?.do_card
  const why    = daily?.nakshatra
    ? `${daily.nakshatra}${daily.tithi_label ? ` · ${daily.tithi_label}` : ''}`
    : 'Planetary alignment supports this window'

  return (
    <section aria-label="Best Window" style={{
      background:'var(--yellow)', color:'#000', borderRadius:16,
      padding:'16px 18px', marginBottom:12
    }}>
      <p style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em',
        fontWeight:600, opacity:0.55, marginBottom:3 }}>Best Window Today</p>
      <p style={{ fontSize:30, fontWeight:800, marginBottom:4, letterSpacing:'-0.02em' }}>
        {daily?.golden_window || '—'}
      </p>
      <p style={{ fontSize:12, opacity:0.65, lineHeight:1.45, marginBottom: mins ? 6 : 0 }}>{why}</p>
      {mins != null && (
        <p style={{ fontSize:12, fontWeight:700 }}>
          ⏰ {mins < 60 ? `${mins}m away` : `${Math.floor(mins/60)}h ${mins % 60}m away`}
        </p>
      )}
    </section>
  )
}

// ─── Section 3: Decision of the Day ──────────────────────────────────────────

function DecisionOfDay({ packages }) {
  // Highest-priority recommendation across all packages
  const top = packages?.[0]
  if (!top) return null

  const icon = CAT_ICON[top.category] || '📌'
  return (
    <section aria-label="Decision of the Day" style={{
      border:'1px solid var(--yellow)', borderRadius:16, padding:'14px 16px', marginBottom:12
    }}>
      <p style={{ fontSize:10, color:'var(--yellow)', textTransform:'uppercase',
        letterSpacing:'0.08em', fontWeight:700, marginBottom:8 }}>Decision of the Day</p>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        <span style={{ fontSize:26, flexShrink:0 }}>{icon}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:15, fontWeight:700, marginBottom:4, lineHeight:1.3 }}>
            {top.title || top.recommendation || top.summary}
          </p>
          <p style={{ fontSize:12, color:'var(--gray-4)', lineHeight:1.5, marginBottom:6 }}>
            {top.summary || top.reason || ''}
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {top.bestWindow && (
              <span style={{ fontSize:11, color:'var(--yellow)', fontWeight:600 }}>
                ⏰ {top.bestWindow}
              </span>
            )}
            {confBadge(top.confidence)}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Shared: Opportunity / Caution card ──────────────────────────────────────

function InsightCard({ pkg, type }) {
  const [open, setOpen] = useState(false)
  const icon    = CAT_ICON[pkg.category] || (type === 'opportunity' ? '✅' : '⚠️')
  const accent  = type === 'opportunity' ? 'var(--green-txt,#4ade80)' : 'var(--red-txt,#f87171)'

  return (
    <div style={{ background:'var(--gray-2)', borderRadius:12, overflow:'hidden', marginBottom:6 }}>
      {/* Always-visible row */}
      <button onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={`${pkg.category} ${type}`}
        style={{ width:'100%', background:'none', border:'none', cursor:'pointer',
          padding:'12px 14px', textAlign:'left', fontFamily:'inherit',
          display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:20, flexShrink:0 }}>{icon}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:3 }}>
            <p style={{ fontSize:13, fontWeight:700, textTransform:'capitalize' }}>{pkg.category}</p>
            {confBadge(pkg.confidence)}
          </div>
          <p style={{ fontSize:12, color:'var(--gray-4)', lineHeight:1.4 }}>
            {pkg.summary || pkg.recommendation || pkg.reason}
          </p>
        </div>
        <span style={{ fontSize:11, color:'var(--gray-4)', flexShrink:0, marginLeft:4 }}>
          {open ? '▴' : '▾'}
        </span>
      </button>

      {/* Expanded: What / Why / When */}
      {open && (
        <div style={{ borderTop:'1px solid var(--gray-3)', padding:'12px 14px' }}>
          {pkg.recommendation && (
            <>
              <p style={{ fontSize:11, color:'var(--gray-4)', textTransform:'uppercase',
                letterSpacing:'0.06em', marginBottom:3 }}>What</p>
              <p style={{ fontSize:13, fontWeight:600, marginBottom:10, lineHeight:1.45 }}>
                {pkg.recommendation}
              </p>
            </>
          )}
          {(pkg.reason || pkg.summary) && (
            <>
              <p style={{ fontSize:11, color:'var(--gray-4)', textTransform:'uppercase',
                letterSpacing:'0.06em', marginBottom:3 }}>Why</p>
              <p style={{ fontSize:12, color:'var(--gray-4)', marginBottom:10, lineHeight:1.5 }}>
                {pkg.reason || pkg.summary}
              </p>
            </>
          )}
          {pkg.bestWindow && (
            <>
              <p style={{ fontSize:11, color:'var(--gray-4)', textTransform:'uppercase',
                letterSpacing:'0.06em', marginBottom:3 }}>When</p>
              <p style={{ fontSize:12, color:accent, fontWeight:600 }}>{pkg.bestWindow}</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Section 4: Today's Opportunities ────────────────────────────────────────

function TodaysOpportunities({ packages }) {
  const opps = (packages || []).filter(p => p.quality === 'supportive' || p.stars >= 4).slice(0, 3)
  if (!opps.length) return null
  return (
    <section aria-label="Today's Opportunities" style={{ marginBottom:12 }}>
      <SectionHeading label="Today's Opportunities" />
      {opps.map((p, i) => <InsightCard key={i} pkg={p} type="opportunity" />)}
    </section>
  )
}

// ─── Section 5: Today's Cautions ─────────────────────────────────────────────

function TodaysCautions({ packages }) {
  const cautions = (packages || []).filter(p => p.quality === 'caution' || p.stars <= 2).slice(0, 3)
  if (!cautions.length) return null
  return (
    <section aria-label="Today's Cautions" style={{ marginBottom:12 }}>
      <SectionHeading label="Today's Cautions" />
      {cautions.map((p, i) => <InsightCard key={i} pkg={p} type="caution" />)}
    </section>
  )
}

// ─── Section 6: Family Today ──────────────────────────────────────────────────

function FamilyToday({ daily, onFamilyPlan }) {
  const alignment = daily?.family_alignment
  const members   = (daily?.members || []).filter((_, i) => i > 0)
  if (!alignment && !members.length) return null

  const familyStars  = alignment?.stars || 3
  const sharedWindow = alignment?.bestSharedWindow || alignment?.best_shared_window
  const activity     = alignment?.recommended?.[0]
  const caution      = alignment?.avoid?.[0]

  return (
    <section aria-label="Family Today" style={{
      background:'var(--gray-2)', borderRadius:16, padding:'14px 16px', marginBottom:12
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <SectionHeading label="Family Today" noMargin />
        <button onClick={onFamilyPlan} style={ghostBtn(true)}>Plan Together</button>
      </div>

      {/* Compact summary row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom: caution ? 10 : 0 }}>
        <div>
          <p style={{ fontSize:10, color:'var(--gray-4)', marginBottom:3 }}>Harmony</p>
          {stars(familyStars, 13)}
        </div>
        {sharedWindow && (
          <div>
            <p style={{ fontSize:10, color:'var(--gray-4)', marginBottom:3 }}>Best Together</p>
            <p style={{ fontSize:13, color:'var(--yellow)', fontWeight:600 }}>{sharedWindow}</p>
          </div>
        )}
        {activity && (
          <div>
            <p style={{ fontSize:10, color:'var(--gray-4)', marginBottom:3 }}>Suggested</p>
            <p style={{ fontSize:12 }}>{activity}</p>
          </div>
        )}
        {caution && (
          <div>
            <p style={{ fontSize:10, color:'var(--gray-4)', marginBottom:3 }}>Be Mindful</p>
            <p style={{ fontSize:12, color:'#f87171' }}>{caution}</p>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Section 7: Timeline ──────────────────────────────────────────────────────

function Timeline({ timeline }) {
  if (!timeline?.length) return null
  return (
    <section aria-label="Today's Timeline" style={{ marginBottom:12 }}>
      <SectionHeading label="Today's Timeline" />
      <div style={{ position:'relative', paddingLeft:20 }}>
        {/* vertical rail */}
        <div style={{ position:'absolute', left:6, top:6, bottom:6,
          width:2, background:'var(--gray-3)', borderRadius:2 }} />
        {timeline.map((t, i) => {
          const dotColor = QUALITY_DOT[t.quality] || 'var(--gray-3)'
          return (
            <div key={i} style={{ position:'relative', marginBottom:14 }}>
              {/* dot */}
              <div style={{ position:'absolute', left:-14, top:3,
                width:10, height:10, borderRadius:'50%',
                background:dotColor, border:'2px solid #000' }} />
              {/* content */}
              <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:2 }}>
                <p style={{ fontSize:12, fontWeight:700, color:dotColor }}>
                  {t.time}{t.end ? `–${t.end}` : ''}
                </p>
                {t.label && (
                  <p style={{ fontSize:11, color:'var(--gray-4)', fontWeight:600 }}>{t.label}</p>
                )}
              </div>
              <p style={{ fontSize:12, color:'var(--gray-4)', lineHeight:1.45 }}>
                {t.recommendation || t.text || ''}
              </p>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:3 }}>
                {t.stars && stars(t.stars, 11)}
                {t.confidence && confBadge(t.confidence, 10)}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─── Section 8: Tomorrow Preview ─────────────────────────────────────────────

function TomorrowPreview({ weekPlan }) {
  const tomorrow = (weekPlan || []).find(d => d.days_ahead === 1) || weekPlan?.[1]
  if (!tomorrow) return null

  const conf = tomorrow.confidence >= 70 ? 'High' : tomorrow.confidence >= 45 ? 'Medium' : 'Low'
  return (
    <section aria-label="Tomorrow Preview" style={{
      background:'var(--gray-2)', borderRadius:16, padding:'14px 16px', marginBottom:12
    }}>
      <p style={{ fontSize:10, color:'var(--gray-4)', textTransform:'uppercase',
        letterSpacing:'0.07em', marginBottom:6 }}>Tomorrow</p>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
        {stars(tomorrow.stars, 15)}
        {confBadge(conf)}
      </div>
      <p style={{ fontSize:13, color:'var(--gray-4)', lineHeight:1.5, marginBottom:4 }}>
        {tomorrow.summary}
      </p>
      {tomorrow.bestWindow && (
        <p style={{ fontSize:12, color:'var(--yellow)', fontWeight:600 }}>
          Best window: {tomorrow.bestWindow}
        </p>
      )}
      {tomorrow.theme && (
        <p style={{ fontSize:12, color:'var(--gray-4)', marginTop:2 }}>Theme: {tomorrow.theme}</p>
      )}
    </section>
  )
}

// ─── Section 9: Next 7 Days ───────────────────────────────────────────────────

function Next7Days({ weekPlan, onFetchFuture }) {
  if (!weekPlan?.length) return null

  // Surface the four most actionable insights from the week
  const sorted    = [...weekPlan].sort((a, b) => (b.stars || 0) - (a.stars || 0))
  const bestCareer  = sorted.find(d => d.bestCategory === 'career' || d.days_ahead > 0)
  const bestFinance = sorted.find(d => d.bestCategory === 'finance' && d !== bestCareer && d.days_ahead > 0)
  const bestFamily  = sorted.find(d => d.bestCategory === 'family' && d !== bestCareer && d !== bestFinance && d.days_ahead > 0)
  const hardest     = [...weekPlan].filter(d => d.days_ahead > 0).sort((a, b) => (a.stars || 0) - (b.stars || 0))[0]

  const highlights = [
    bestCareer  && { label:'Best Career Day',   day: bestCareer,  icon:'💼' },
    bestFinance && { label:'Best Finance Day',  day: bestFinance, icon:'💰' },
    bestFamily  && { label:'Best Family Day',   day: bestFamily,  icon:'👨‍👩‍👧' },
    hardest     && { label:'Most Challenging',  day: hardest,     icon:'⚠️' }
  ].filter(Boolean)

  return (
    <section aria-label="Next 7 Days" style={{ marginBottom:12 }}>
      <SectionHeading label="Next 7 Days" />

      {/* 4 highlight cells — 2×2 grid, no horizontal scroll */}
      {highlights.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10 }}>
          {highlights.map(({ label, day, icon }) => (
            <button key={label} onClick={() => day.days_ahead > 0 && onFetchFuture?.(day.days_ahead)}
              style={{ background:'var(--gray-2)', border:'none', borderRadius:12,
                padding:'10px 12px', cursor: day.days_ahead > 0 ? 'pointer' : 'default',
                textAlign:'left', fontFamily:'inherit' }}
              aria-label={`${label}: ${day.label}`}>
              <p style={{ fontSize:12, color:'var(--gray-4)', marginBottom:4 }}>
                {icon} {label}
              </p>
              <p style={{ fontSize:14, fontWeight:700, marginBottom:2 }}>{day.label}</p>
              {stars(day.stars, 11)}
            </button>
          ))}
        </div>
      )}

      {/* Full 7-day row — 2-column grid, no horizontal scroll */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
        {weekPlan.map((d, i) => {
          const conf      = d.confidence >= 70 ? 'High' : d.confidence >= 45 ? 'Medium' : 'Low'
          const confColor = CONF_COLOR[conf] || '#facc15'
          return (
            <button key={i}
              onClick={() => d.days_ahead > 0 && onFetchFuture?.(d.days_ahead)}
              style={{ background:'var(--gray-2)', border: i === 0 ? '1px solid var(--gray-3)' : 'none',
                borderRadius:10, padding:'9px 11px',
                cursor: d.days_ahead > 0 ? 'pointer' : 'default',
                textAlign:'left', fontFamily:'inherit' }}
              aria-label={`${d.label}: ${d.summary}`}>
              <p style={{ fontSize:11, color: i === 0 ? 'var(--yellow)' : 'var(--gray-4)',
                marginBottom:2, fontWeight: i === 0 ? 700 : 400 }}>{d.label}</p>
              {stars(d.stars, 11)}
              <p style={{ fontSize:10, color:confColor, marginTop:2, fontWeight:600 }}>{d.summary}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}

// ─── Shared: Section heading ──────────────────────────────────────────────────

function SectionHeading({ label, noMargin }) {
  return (
    <p style={{ fontSize:11, color:'var(--gray-4)', textTransform:'uppercase',
      letterSpacing:'0.07em', fontWeight:600,
      marginBottom: noMargin ? 0 : 10, marginTop:0 }}>
      {label}
    </p>
  )
}

// ─── Ghost button helper ──────────────────────────────────────────────────────

function ghostBtn(small) {
  return {
    background:'none', border:'1px solid var(--gray-3)', borderRadius:20,
    color:'var(--yellow)', fontSize: small ? 11 : 12, fontWeight:600,
    padding: small ? '3px 10px' : '5px 12px',
    cursor:'pointer', fontFamily:'inherit', minHeight: small ? 28 : 32
  }
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
        <p style={{ fontSize:13, fontWeight:600, marginBottom:1 }}>Add to Home Screen</p>
        <p style={{ fontSize:11, color:'var(--gray-4)' }}>Daily guidance in one tap</p>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        <button onClick={handleInstall}
          style={{ background:'var(--yellow)', border:'none', borderRadius:10,
            padding:'7px 12px', fontSize:12, fontWeight:700, color:'#000',
            cursor:'pointer', fontFamily:'inherit', minHeight:32 }}>
          Install
        </button>
        <button onClick={onDismiss} aria-label="Dismiss install prompt"
          style={{ background:'none', border:'none', color:'var(--gray-4)',
            fontSize:18, cursor:'pointer', minHeight:32, padding:'0 4px' }}>✕</button>
      </div>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  const block = (h, mb = 8, r = 12) => (
    <div style={{ height:h, background:'var(--gray-2)', borderRadius:r, marginBottom:mb, opacity:0.6 }} />
  )
  return (
    <div style={{ paddingTop:8 }}>
      {block(80, 12, 16)}
      {block(90, 12, 16)}
      {block(48, 6)}
      {block(48, 6)}
      {block(48, 12)}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function HomeScreen({
  daily, loading,
  primaryUser,
  onProfileOpen, onInvite, onFamilyPlan, onFetchFuture,
  recommendationPackages
}) {
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    const h = () => setShowInstall(true)
    window.addEventListener('installable', h)
    return () => window.removeEventListener('installable', h)
  }, [])

  // Derive opportunities vs cautions from ranked packages
  const opps     = (recommendationPackages || []).filter(p => p.quality === 'supportive' || (p.stars >= 4))
  const cautions = (recommendationPackages || []).filter(p => p.quality === 'caution' || (p.stars <= 2))
  const primary  = daily?.members?.[0] || null

  return (
    <main style={{ padding:'0 16px', overflowX:'hidden' }}>
      <Header primaryUser={primaryUser} onProfileOpen={onProfileOpen} onInvite={onInvite} />

      {showInstall && <InstallBanner onDismiss={() => setShowInstall(false)} />}

      {loading ? <LoadingSkeleton /> : (
        <>
          <MorningBrief daily={daily} primaryUser={primaryUser} />
          <BestWindow daily={daily} />
          <DecisionOfDay packages={recommendationPackages} />
          <TodaysOpportunities packages={opps} />
          <TodaysCautions packages={cautions} />
          <FamilyToday daily={daily} onFamilyPlan={onFamilyPlan} />
          <Timeline timeline={primary?.timeline} />
          <TomorrowPreview weekPlan={daily?.week_plan} />
          <Next7Days weekPlan={daily?.week_plan} onFetchFuture={onFetchFuture} />

          <div style={{ textAlign:'center', padding:'16px 0 10px', borderTop:'1px solid var(--gray-3)' }}>
            <p style={{ fontSize:10, color:'var(--gray-3)' }}>Kairos · Decision Intelligence</p>
          </div>
        </>
      )}
    </main>
  )
}
