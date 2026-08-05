/**
 * HomeScreen — Life Planning Companion
 * v27.1 UX Realisation
 *
 * All data comes from:
 *   - recommendationPackages  (Recommendation Service)
 *   - weeklyPlan              (Weekly Planner)
 *   - opportunities           (Upcoming Opportunities)
 *   - daily / brief           (Daily Brief Engine)
 *
 * Zero business logic here. Pure presentation.
 *
 * Reading order:
 *   1. Morning Brief (hero — full day summary in one card)
 *   2. Top Recommendations (3 highest-priority packages)
 *   3. Upcoming (next 3 planning windows)
 *   4. This Week (4 best-day highlights from Weekly Planner)
 *   5. Timeline
 *   6. Family Brief
 *   7. Tomorrow Preview
 */

import { useEffect, useState, useMemo } from 'react'
import Logo from './Logo'
import { minsUntilWindow } from '../lib/dataClient'
import { buildMorningBrief } from '../../lib/dailyBrief/index.js'

// ─── Design tokens (local, consistent) ───────────────────────────────────────
const C = {
  yellow:  '#facc15',
  green:   '#4ade80',
  amber:   '#fb923c',
  red:     '#f87171',
  gray2:   'var(--gray-2)',
  gray3:   'var(--gray-3)',
  gray4:   'var(--gray-4)',
  white:   '#fff',
  cardR:   14,    // border-radius for all cards
  pad:     '12px 14px',
  gap:     8
}

const CONF_C = { High: C.green, Medium: C.yellow, Low: C.red }
const DOT_C  = { Excellent: C.green, Good: C.yellow, Moderate: C.amber, 'Low energy': C.red }
const CAT_ICON = {
  career:'💼', finance:'💰', money:'💰', relationships:'❤️', health:'🌿',
  learning:'📚', travel:'✈️', spiritual:'🛕', home:'🏠', family:'👨‍👩‍👧',
  shopping:'🛍️', medical:'🏥', communication:'💬', business:'🏢',
  property:'🏠', legal:'⚖️', planning:'📋', education:'📚'
}

// ─── Micro-components ─────────────────────────────────────────────────────────

function Stars({ n = 3, size = 13 }) {
  return (
    <span aria-label={`${n} out of 5 stars`} style={{ fontSize:size, letterSpacing:1 }}>
      {[1,2,3,4,5].map(i => <span key={i} style={{ opacity: i <= n ? 1 : 0.18 }}>★</span>)}
    </span>
  )
}

function Conf({ level, size = 11 }) {
  return <span style={{ fontSize:size, color: CONF_C[level] || C.yellow, fontWeight:700 }}>{level || 'Medium'}</span>
}

function Label({ text, color }) {
  return (
    <p style={{ fontSize:10, color: color || C.gray4, textTransform:'uppercase',
      letterSpacing:'0.07em', fontWeight:600, marginBottom:4 }}>
      {text}
    </p>
  )
}

function Card({ children, style, onClick, role, ariaLabel }) {
  return (
    <div onClick={onClick} role={role} aria-label={ariaLabel}
      style={{ background: C.gray2, borderRadius:C.cardR, padding:C.pad, marginBottom:C.gap,
        cursor: onClick ? 'pointer' : undefined, ...style }}>
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ height:1, background: C.gray3, margin:'16px 0' }} />
}

function SectionTitle({ children }) {
  return (
    <p style={{ fontSize:11, color: C.gray4, textTransform:'uppercase',
      letterSpacing:'0.07em', fontWeight:600, marginBottom:10 }}>
      {children}
    </p>
  )
}

// ─── Install Banner ───────────────────────────────────────────────────────────
function InstallBanner({ onDismiss }) {
  function install() {
    window.__installPrompt?.prompt()
    window.__installPrompt?.userChoice?.then(() => { window.__installPrompt = null; onDismiss() })
  }
  return (
    <div style={{ background: C.gray2, borderRadius:C.cardR, padding:C.pad, marginBottom:C.gap,
      display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:13, fontWeight:600, marginBottom:1 }}>Add to Home Screen</p>
        <p style={{ fontSize:11, color: C.gray4 }}>Daily guidance in one tap</p>
      </div>
      <button onClick={install} style={{ background: C.yellow, border:'none', borderRadius:10,
        padding:'7px 12px', fontSize:12, fontWeight:700, color:'#000', cursor:'pointer',
        fontFamily:'inherit', minHeight:32 }}>Install</button>
      <button onClick={onDismiss} aria-label="Dismiss" style={{ background:'none', border:'none',
        color: C.gray4, fontSize:18, cursor:'pointer', minHeight:32, padding:'0 4px' }}>✕</button>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function Skeleton() {
  const b = (h, mb = C.gap) => (
    <div style={{ height:h, background: C.gray2, borderRadius:C.cardR, marginBottom:mb, opacity:.55 }} />
  )
  return <>{b(140, 8)}{b(96, 8)}{b(80, 8)}{b(80, 8)}</>
}

// ─── SECTION 1: Morning Brief (hero — one unified card) ───────────────────────
function MorningBrief({ daily, primaryUser, brief }) {
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name     = primaryUser?.name?.split(' ')[0] || null
  const [mins, setMins] = useState(() => minsUntilWindow(brief?.bestWindow || daily?.golden_window))

  useEffect(() => {
    const t = setInterval(() => setMins(minsUntilWindow(brief?.bestWindow || daily?.golden_window)), 60000)
    return () => clearInterval(t)
  }, [brief?.bestWindow, daily?.golden_window])

  if (!daily && !brief) return null

  const theme      = brief?.theme     || daily?.focus || 'Decision Making'
  const outlook    = brief?.outlook   || 'Neutral'
  const bestWindow = brief?.bestWindow || daily?.golden_window
  const confidence = brief?.confidence || 'Medium'
  const topOpp     = brief?.opportunities?.[0]
  const topCaution = brief?.cautions?.[0]
  const familyBrief = brief?.familyBrief

  const outlookColor = outlook === 'Positive' ? C.green : outlook === 'Challenging' ? C.red : C.yellow
  const dayStars     = daily?.members?.[0]?.stars || daily?.stars || 3
  const summaryText  = brief?.decisionOfDay || daily?.members?.[0]?.summary || null

  return (
    <section aria-label="Morning Brief" style={{
      background: C.gray2, borderRadius:16, padding:'16px', marginBottom:C.gap
    }}>
      {/* Greeting + outlook row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div>
          <p style={{ fontSize:13, color: C.gray4, marginBottom:2 }}>
            {greeting}{name ? `, ${name}` : ''}
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Stars n={dayStars} size={16} />
            <span style={{ fontSize:14, fontWeight:700, color: outlookColor }}>{outlook}</span>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <Label text="Confidence" color={C.gray4} />
          <Conf level={confidence} size={13} />
        </div>
      </div>

      {/* Theme + best window — inline, not separate cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
        <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:10, padding:'8px 10px' }}>
          <Label text="Today's Theme" />
          <p style={{ fontSize:14, fontWeight:700 }}>{theme}</p>
        </div>
        <div style={{ background: C.yellow, borderRadius:10, padding:'8px 10px', color:'#000' }}>
          <p style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.07em',
            fontWeight:600, opacity:.55, marginBottom:2 }}>
            Best Window{mins != null ? ` · ${mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h`}` : ''}
          </p>
          <p style={{ fontSize:18, fontWeight:800, letterSpacing:'-0.01em' }}>{bestWindow || '—'}</p>
        </div>
      </div>

      {/* Summary sentence */}
      {summaryText && (
        <p style={{ fontSize:13, color: C.gray4, lineHeight:1.55, marginBottom:10 }}>{summaryText}</p>
      )}

      {/* One opportunity + one caution inline */}
      {(topOpp || topCaution) && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom: familyBrief ? 10 : 0 }}>
          {topOpp && (
            <div style={{ background:'rgba(74,222,128,0.08)', borderRadius:10, padding:'8px 10px' }}>
              <Label text="Opportunity" color={C.green} />
              <p style={{ fontSize:12, lineHeight:1.45, color: C.white }}>{topOpp.advice || topOpp.recommendation}</p>
            </div>
          )}
          {topCaution && (
            <div style={{ background:'rgba(248,113,113,0.08)', borderRadius:10, padding:'8px 10px' }}>
              <Label text="Be Mindful" color={C.red} />
              <p style={{ fontSize:12, lineHeight:1.45, color: C.white }}>{topCaution.advice || topCaution.recommendation}</p>
            </div>
          )}
        </div>
      )}

      {/* Family snippet */}
      {familyBrief && (
        <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'8px 10px', marginTop: topOpp || topCaution ? 6 : 0 }}>
          <Label text="Family" />
          <p style={{ fontSize:12, color: C.gray4, lineHeight:1.4 }}>
            {familyBrief.energy === 'High' ? 'Strong family harmony today.' : 'Moderate family energy — keep interactions light.'}
            {familyBrief.bestWindow ? ` Best together: ${familyBrief.bestWindow}.` : ''}
          </p>
        </div>
      )}
    </section>
  )
}

// ─── SECTION 2: Top Recommendations (3 packages) ─────────────────────────────
function RecommendationCard({ pkg, onFeedback }) {
  const [open, setOpen]   = useState(false)
  const [done, setDone]   = useState(null)
  const icon = CAT_ICON[pkg.category] || '📌'

  function act(e, val) {
    e.stopPropagation()
    setDone(val)
    onFeedback?.(pkg.category, pkg.recommendation, val)
  }

  return (
    <Card ariaLabel={`${pkg.title || pkg.category} recommendation`}>
      {/* Collapsed: always scannable */}
      <button onClick={() => setOpen(o => !o)}
        style={{ width:'100%', background:'none', border:'none', cursor:'pointer',
          textAlign:'left', fontFamily:'inherit', padding:0 }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
          <span style={{ fontSize:22, flexShrink:0, marginTop:2 }}>{icon}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
              <p style={{ fontSize:13, fontWeight:700 }}>{pkg.title || pkg.category}</p>
              <Conf level={pkg.confidence} />
            </div>
            <p style={{ fontSize:12, color: C.gray4, lineHeight:1.4 }}>
              {pkg.summary || pkg.recommendation}
            </p>
            {pkg.bestWindow && (
              <p style={{ fontSize:11, color: C.yellow, marginTop:4, fontWeight:600 }}>
                ⏰ {pkg.bestWindow}
              </p>
            )}
          </div>
          <span style={{ fontSize:11, color: C.gray4, flexShrink:0, paddingTop:2 }}>
            {open ? '▴' : '▾'}
          </span>
        </div>
      </button>

      {/* Expanded: What / Why / When */}
      {open && (
        <div style={{ borderTop:`1px solid ${C.gray3}`, marginTop:10, paddingTop:10 }}>
          {pkg.recommendation && pkg.recommendation !== pkg.summary && (
            <>
              <Label text="What" />
              <p style={{ fontSize:13, fontWeight:600, marginBottom:8, lineHeight:1.45, color: C.white }}>
                {pkg.recommendation}
              </p>
            </>
          )}
          {pkg.reasoning && (
            <>
              <Label text="Why" />
              <p style={{ fontSize:12, color: C.gray4, marginBottom:8, lineHeight:1.5 }}>{pkg.reasoning}</p>
            </>
          )}
          {pkg.bestWindow && (
            <>
              <Label text="When" />
              <p style={{ fontSize:12, color: C.yellow, fontWeight:600, marginBottom:10 }}>{pkg.bestWindow}</p>
            </>
          )}
          {!done ? (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {[['helpful','✓ Done'], ['not_helpful','✗ Skip'], ['skipped','Not relevant']].map(([v, l]) => (
                <button key={v} onClick={e => act(e, v)} style={{
                  background:'rgba(255,255,255,0.06)', border:'none', borderRadius:8,
                  padding:'6px 10px', fontSize:11, color: C.gray4, cursor:'pointer',
                  fontFamily:'inherit', fontWeight:600, minHeight:32
                }}>{l}</button>
              ))}
            </div>
          ) : (
            <p style={{ fontSize:11, color: C.gray4 }}>✓ Recorded.</p>
          )}
        </div>
      )}
    </Card>
  )
}

function TopRecommendations({ packages, onFeedback }) {
  const top = (packages || []).slice(0, 3)
  if (!top.length) return (
    <section style={{ marginBottom:4 }}>
      <SectionTitle>Your Priorities</SectionTitle>
      <Card><p style={{ fontSize:12, color:C.gray4, textAlign:'center', padding:'8px 0' }}>Loading recommendations…</p></Card>
    </section>
  )
  return (
    <section aria-label="Top Recommendations" style={{ marginBottom:4 }}>
      <SectionTitle>Your Priorities</SectionTitle>
      {top.map((p, i) => <RecommendationCard key={p.id || i} pkg={p} onFeedback={onFeedback} />)}
    </section>
  )
}

// ─── SECTION 3: Upcoming Opportunities ───────────────────────────────────────
function Upcoming({ opportunities, weekPlan, onFetchFuture }) {
  // Merge opportunity windows with best week days; deduplicate; take top 3
  const items = useMemo(() => {
    const opp = (opportunities || []).map(o => ({
      label: o.label, reason: o.title, confidence: o.confidence, daysAhead: o.daysAhead, stars: o.stars
    }))
    const wp = (weekPlan?.days || []).filter(d => d.days_ahead > 0 && d.stars >= 4).map(d => ({
      label: d.label, reason: d.summary, confidence: d.confidence >= 70 ? 'High' : 'Medium', daysAhead: d.days_ahead, stars: d.stars
    }))
    const merged = [...opp, ...wp]
    const seen = new Set()
    return merged.filter(m => { if (seen.has(m.label)) return false; seen.add(m.label); return true }).slice(0, 3)
  }, [opportunities, weekPlan])

  if (!items.length) return null
  return (
    <section aria-label="Upcoming" style={{ marginBottom:4 }}>
      <SectionTitle>Upcoming</SectionTitle>
      {items.map((item, i) => (
        <div key={i} onClick={() => item.daysAhead > 0 && onFetchFuture?.(item.daysAhead)}
          style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
            background: C.gray2, borderRadius:C.cardR, marginBottom:C.gap,
            cursor: item.daysAhead > 0 ? 'pointer' : 'default' }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
              <p style={{ fontSize:13, fontWeight:700 }}>{item.label}</p>
              <Conf level={item.confidence} />
            </div>
            <p style={{ fontSize:12, color: C.gray4, lineHeight:1.4 }}>{item.reason}</p>
          </div>
          <Stars n={item.stars} size={11} />
        </div>
      ))}
    </section>
  )
}

// ─── SECTION 4: This Week (4 best-day highlights) ────────────────────────────
function ThisWeek({ weeklyPlan, onFetchFuture }) {
  if (!weeklyPlan?.categories?.length) return (
    <section style={{ marginBottom:4 }}>
      <SectionTitle>This Week</SectionTitle>
      <Card><p style={{ fontSize:12, color:C.gray4, textAlign:'center', padding:'8px 0' }}>Loading week plan…</p></Card>
    </section>
  )

  const highlights = weeklyPlan.categories
    .filter((_, i) => i < 4)
    .map(c => ({ icon: c.icon, label: c.label, day: c.bestDay, daysAhead: c.daysAhead, stars: c.stars, confidence: c.confidence }))

  return (
    <section aria-label="This Week" style={{ marginBottom:4 }}>
      <SectionTitle>This Week</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:C.gap }}>
        {highlights.map((h, i) => (
          <button key={i} onClick={() => h.daysAhead > 0 && onFetchFuture?.(h.daysAhead)}
            aria-label={`${h.label}: best day is ${h.day}`}
            style={{ background: C.gray2, border:'none', borderRadius:C.cardR, padding:'10px 12px',
              cursor: h.daysAhead > 0 ? 'pointer' : 'default', textAlign:'left', fontFamily:'inherit' }}>
            <p style={{ fontSize:12, color: C.gray4, marginBottom:4 }}>{h.icon} {h.label}</p>
            <p style={{ fontSize:14, fontWeight:700, marginBottom:3 }}>{h.day}</p>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Stars n={h.stars} size={11} />
              <Conf level={h.confidence} size={10} />
            </div>
          </button>
        ))}
      </div>
      {weeklyPlan.challenging && (
        <div style={{ background:`rgba(248,113,113,0.07)`, borderRadius:C.cardR,
          padding:'9px 12px', marginTop:C.gap, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <Label text="Most Challenging Day" color={C.red} />
            <p style={{ fontSize:13, fontWeight:600 }}>{weeklyPlan.challenging.label}</p>
          </div>
          <Stars n={weeklyPlan.challenging.stars} size={12} />
        </div>
      )}
    </section>
  )
}

// ─── SECTION 5: Timeline ──────────────────────────────────────────────────────
function Timeline({ timeline }) {
  if (!timeline?.length) return (
    <section style={{ marginBottom:4 }}>
      <SectionTitle>Today's Timeline</SectionTitle>
      <Card><p style={{ fontSize:12, color:C.gray4, textAlign:'center', padding:'8px 0' }}>Timeline loading…</p></Card>
    </section>
  )
  return (
    <section aria-label="Timeline" style={{ marginBottom:4 }}>
      <SectionTitle>Today's Timeline</SectionTitle>
      <div style={{ position:'relative', paddingLeft:18 }}>
        <div style={{ position:'absolute', left:5, top:6, bottom:6,
          width:2, background: C.gray3, borderRadius:2 }} />
        {timeline.map((t, i) => {
          const dotC = DOT_C[t.quality] || C.gray3
          const conf = t.confidence || (t.quality === 'Excellent' ? 'High' : t.quality === 'Good' ? 'Medium' : 'Low')
          return (
            <div key={i} style={{ position:'relative', marginBottom:14 }}>
              <div style={{ position:'absolute', left:-13, top:4, width:8, height:8,
                borderRadius:'50%', background: dotC, border:'2px solid #000' }} />
              <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:2 }}>
                <p style={{ fontSize:12, fontWeight:700, color: dotC }}>
                  {t.time}{t.end ? `–${t.end}` : ''}
                </p>
                {t.label && <p style={{ fontSize:11, color: C.gray4, fontWeight:600 }}>{t.label}</p>}
                <Conf level={conf} size={10} />
              </div>
              <p style={{ fontSize:12, color: C.gray4, lineHeight:1.45 }}>
                {t.label || t.recommendation || t.text || ''}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─── SECTION 6: Family Brief ──────────────────────────────────────────────────
function FamilyBrief({ daily, brief, onFamilyPlan }) {
  const alignment = daily?.family_alignment
  const fb        = brief?.familyBrief
  const hasFamily = (daily?.members?.length || 0) > 1

  if (!hasFamily && !alignment && !fb) return null

  const energy     = fb?.energy || (alignment?.stars >= 4 ? 'High' : 'Moderate')
  const bestWindow = fb?.bestWindow || alignment?.best_shared_window || alignment?.bestSharedWindow
  const activity   = fb?.activities?.[0] || alignment?.recommended?.[0]
  const caution    = alignment?.avoid?.[0]

  return (
    <section aria-label="Family Brief" style={{ marginBottom:4 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <SectionTitle>Family Today</SectionTitle>
        <button onClick={onFamilyPlan} style={{
          background:'none', border:`1px solid ${C.gray3}`, borderRadius:20,
          color: C.yellow, fontSize:11, fontWeight:600, padding:'3px 10px',
          cursor:'pointer', fontFamily:'inherit', minHeight:28, marginBottom:10
        }}>Plan Together</button>
      </div>
      <Card>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <div>
            <Label text="Family Energy" />
            <p style={{ fontSize:14, fontWeight:700,
              color: energy === 'High' ? C.green : C.yellow }}>{energy}</p>
          </div>
          {bestWindow && (
            <div>
              <Label text="Best Together" />
              <p style={{ fontSize:14, fontWeight:700, color: C.yellow }}>{bestWindow}</p>
            </div>
          )}
          {activity && (
            <div>
              <Label text="Suggested" />
              <p style={{ fontSize:12 }}>{activity}</p>
            </div>
          )}
          {caution && (
            <div>
              <Label text="Be Mindful" color={C.red} />
              <p style={{ fontSize:12, color: C.red }}>{caution}</p>
            </div>
          )}
        </div>
      </Card>
    </section>
  )
}

// ─── SECTION 7: Tomorrow Preview ─────────────────────────────────────────────
function TomorrowPreview({ brief, weekPlan, onFetchFuture }) {
  const tomorrow = brief?.tomorrowPreview || (weekPlan || []).find(d => d.days_ahead === 1)
  if (!tomorrow) return null

  const conf = tomorrow.confidence || (tomorrow.stars >= 4 ? 'High' : tomorrow.stars >= 3 ? 'Medium' : 'Low')

  return (
    <section aria-label="Tomorrow Preview" style={{ marginBottom:4 }}>
      <SectionTitle>Tomorrow</SectionTitle>
      <div onClick={() => onFetchFuture?.(1)} role="button"
        style={{ background: C.gray2, borderRadius:C.cardR, padding:C.pad, cursor:'pointer' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Stars n={tomorrow.stars} size={14} />
            <Conf level={conf} size={12} />
          </div>
          {tomorrow.theme && <p style={{ fontSize:11, color: C.gray4 }}>{tomorrow.theme}</p>}
        </div>
        <p style={{ fontSize:13, color: C.gray4, lineHeight:1.5, marginBottom:4 }}>
          {tomorrow.summary}
        </p>
        {(tomorrow.bestWindow || tomorrow.best_window) && (
          <p style={{ fontSize:12, color: C.yellow, fontWeight:600 }}>
            Best window: {tomorrow.bestWindow || tomorrow.best_window}
          </p>
        )}
      </div>
    </section>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ primaryUser, onProfileOpen, onInvite }) {
  return (
    <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
      paddingTop:'calc(10px + env(safe-area-inset-top,0px))', paddingBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Logo />
        <span style={{ fontSize:17, fontWeight:700, letterSpacing:'-0.01em' }}>Kairos</span>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        <button onClick={onInvite} style={ghostBtn()}>Share</button>
        <button onClick={onProfileOpen} style={ghostBtn()}>
          {primaryUser?.name ? `👤 ${primaryUser.name.split(' ')[0]}` : '+ Me'}
        </button>
      </div>
    </header>
  )
}
function ghostBtn() {
  return { background:'none', border:`1px solid ${C.gray3}`, borderRadius:20,
    color: C.yellow, fontSize:11, fontWeight:600, padding:'5px 12px',
    cursor:'pointer', fontFamily:'inherit', minHeight:32 }
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function HomeScreen({
  daily, loading,
  primaryUser, userData,
  onProfileOpen, onInvite, onFamilyPlan, onFetchFuture, onFeedback,
  recommendationPackages,
  weeklyPlan,
  opportunities
}) {
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    const h = () => setShowInstall(true)
    window.addEventListener('installable', h)
    return () => window.removeEventListener('installable', h)
  }, [])

  // Brief built from daily + primaryMember; memoised
  const brief = useMemo(() => {
    if (!daily) return null
    return buildMorningBrief(daily, daily.members?.[0] || null)
  }, [daily])

  const primaryMember = daily?.members?.[0] || null

  return (
    <main style={{ padding:'0 16px', overflowX:'hidden', paddingBottom:8 }}>
      <Header primaryUser={primaryUser} onProfileOpen={onProfileOpen} onInvite={onInvite} />

      {showInstall && <InstallBanner onDismiss={() => setShowInstall(false)} />}

      {loading ? <Skeleton /> : (
        <>
          <MorningBrief daily={daily} primaryUser={primaryUser} brief={brief} />
          <TopRecommendations packages={recommendationPackages} onFeedback={onFeedback} />
          <Divider />
          <Upcoming opportunities={opportunities} weekPlan={weeklyPlan} onFetchFuture={onFetchFuture} />
          <Divider />
          <ThisWeek weeklyPlan={weeklyPlan} onFetchFuture={onFetchFuture} />
          <Divider />
          <Timeline timeline={primaryMember?.timeline} />
          <FamilyBrief daily={daily} brief={brief} onFamilyPlan={onFamilyPlan} />
          <TomorrowPreview brief={brief} weekPlan={daily?.week_plan} onFetchFuture={onFetchFuture} />
          <div style={{ textAlign:'center', padding:'16px 0 8px', borderTop:`1px solid ${C.gray3}` }}>
            <p style={{ fontSize:10, color: C.gray3 }}>Kairos · Life Planning Companion</p>
          </div>
        </>
      )}
    </main>
  )
}
