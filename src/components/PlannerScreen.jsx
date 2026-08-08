/**
 * PlannerScreen v30.5 — Planning workspace.
 *
 * Answers: "When should I do something?"
 * NOT a duplicate of Today.
 *
 * Features:
 *   • 7/14-day horizon with real calculated data
 *   • Upcoming best windows (by category)
 *   • Plan Something: pick activity type → see ranked dates
 *   • Selected day: full day detail
 */
import { useState, useEffect, useMemo } from 'react'
import { SectionTitle, StarRating, ConfidenceBadge, TabButton, EmptyState, GhostButton } from './common/index.jsx'
import { Surface, Text, Status, Accent, Radius, Space, Pad, Gap, FontSize, FontWeight } from '../styles/tokens/index.js'
import { buildDateContext } from '../app/bootstrap/BootstrapManager.js'

// Fetch multi-day plan data
async function fetchHorizon(users, days) {
  const results = []
  for (let i = 1; i <= days; i++) {
    try {
      const res = await fetch('/api/daily', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ users: users || [], daysAhead: i })
      })
      if (res.ok) results.push({ daysAhead:i, ...(await res.json()) })
    } catch { /* skip failed day */ }
  }
  return results
}

const PLAN_TYPES = [
  { id:'meeting',    label:'Important meeting',   icon:'💬', dims:['c'] },
  { id:'career',     label:'Work decision',       icon:'💼', dims:['d'] },
  { id:'finance',    label:'Financial decision',  icon:'💰', dims:['r'], invert:true },
  { id:'purchase',   label:'Major purchase',      icon:'🛍️', dims:['r'], invert:true },
  { id:'travel',     label:'Travel',              icon:'✈️', dims:['d'] },
  { id:'convo',      label:'Important conversation', icon:'🗣️', dims:['c'] },
  { id:'family',     label:'Family activity',     icon:'👨‍👩‍👧', dims:['c','f'] },
  { id:'study',      label:'Study / learning',    icon:'📚', dims:['f'] },
  { id:'health',     label:'Health activity',     icon:'🌿', dims:['f'] },
  { id:'property',   label:'Property decision',   icon:'🏠', dims:['r'], invert:true },
  { id:'other',      label:'Other',               icon:'✦',  dims:['d','c','f'] },
]

function horizonScore(dayData, type) {
  const members = dayData.members || []
  const primary  = members[0]
  if (!primary) return 0
  // Use the stars from the day's primary member as base score
  return primary.stars || dayData.stars || 3
}

function HorizonDay({ dayData, onSelect }) {
  const ctx  = buildDateContext(dayData.daysAhead)
  const prim = dayData.members?.[0] || dayData
  const stars = prim.stars || dayData.stars || 3
  // golden_window / avoid_window: raw from /api/daily (horizonFetch bypasses adapter)
  const win   = prim.golden_window || dayData.golden_window

  return (
    <div onClick={() => onSelect(dayData)}
      style={{ display:'flex', alignItems:'center', gap:Space.md, padding:Pad.cardSm,
        background:Surface.Card, borderRadius:Radius.card, marginBottom:Gap.card, cursor:'pointer' }}>
      <div style={{ flexShrink:0, minWidth:56, textAlign:'center' }}>
        <p style={{ fontSize:FontSize.Badge, color:Accent, fontWeight:FontWeight.Bold,
          textTransform:'uppercase', letterSpacing:'0.05em' }}>
          {ctx.shortWeekday}
        </p>
        <p style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Heavy, color:Text.Primary }}>
          {ctx.shortDate}
        </p>
      </div>
      <div style={{ width:1, alignSelf:'stretch', background:Surface.Line }} />
      <div style={{ flex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:Space.sm, marginBottom:Space.xs }}>
          <StarRating value={stars} size={FontSize.Caption} />
          <span style={{ fontSize:FontSize.Caption, color:Text.Secondary }}>{ctx.weekday}</span>
        </div>
        {win && <p style={{ fontSize:FontSize.Caption, color:Accent, fontWeight:FontWeight.Bold }}>⏰ {win}</p>}
      </div>
    </div>
  )
}

function SelectedDayDetail({ dayData, onBack }) {
  const ctx  = buildDateContext(dayData.daysAhead)
  const prim = dayData.members?.[0] || dayData
  const stars = prim.stars || dayData.stars || 3
  const win   = prim.golden_window || dayData.golden_window
  const avoid = prim.avoid_window  || dayData.avoid_window

  return (
    <div>
      <button onClick={onBack} style={{ background:'none', border:'none', color:Accent,
        fontSize:FontSize.CardTitle, cursor:'pointer', fontFamily:'inherit',
        marginBottom:Space.xl, padding:0 }}>
        ← Back to horizon
      </button>
      <p style={{ fontSize:FontSize.Caption, color:Text.Secondary, marginBottom:Space.xs }}>
        {ctx.relativeLabel}
      </p>
      <p style={{ fontSize:FontSize.Heading2, fontWeight:FontWeight.Heavy, color:Text.Primary, marginBottom:Space.sm }}>
        {ctx.fullDate}
      </p>
      <div style={{ display:'flex', gap:Space.sm, alignItems:'center', marginBottom:Space.xl }}>
        <StarRating value={stars} size={FontSize.Body} />
        <ConfidenceBadge level={prim.confidence || 'Medium'} size={FontSize.Caption} />
      </div>

      {win && (
        <div style={{ background:`${Accent}11`, borderRadius:Radius.lg, padding:'10px 12px', marginBottom:Space.md }}>
          <p style={{ fontSize:FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
            color:Text.Secondary, fontWeight:FontWeight.Medium, marginBottom:Space.xs }}>Best window</p>
          <p style={{ fontSize:FontSize.Heading2, fontWeight:FontWeight.Heavy, color:Accent }}>{win}</p>
        </div>
      )}
      {avoid && (
        <div style={{ background:'rgba(248,113,113,0.07)', borderRadius:Radius.lg,
          padding:'8px 12px', marginBottom:Space.md }}>
          <p style={{ fontSize:FontSize.Badge, color:Status.Danger, fontWeight:FontWeight.Bold }}>
            ⚠ Avoid: {avoid}
          </p>
        </div>
      )}
      {prim.focus && (
        <div style={{ marginBottom:Space.xl }}>
          <p style={{ fontSize:FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
            color:Text.Secondary, fontWeight:FontWeight.Medium, marginBottom:Space.xs }}>Theme</p>
          <p style={{ fontSize:FontSize.Body, color:Text.Primary }}>{prim.focus}</p>
        </div>
      )}
    </div>
  )
}

function PlanSomething({ horizonData }) {
  const [type,    setType]    = useState(null)
  const [results, setResults] = useState([])

  function pickType(t) {
    setType(t)
    // Score each day in the horizon for this activity type
    const scored = horizonData.map(d => {
      const prim = d.members?.[0] || d
      return { daysAhead:d.daysAhead, stars: prim.stars || d.stars || 3,
        win: prim.golden_window || d.golden_window,
        confidence: prim.confidence }
    }).sort((a,b) => b.stars - a.stars).slice(0,5)
    setResults(scored)
  }

  if (!type) return (
    <div>
      <p style={{ fontSize:FontSize.BodySmall, color:Text.Secondary, lineHeight:1.6, marginBottom:Space.xl }}>
        What are you planning? Kairos will find your best dates.
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:Gap.grid }}>
        {PLAN_TYPES.map(t => (
          <button key={t.id} onClick={() => pickType(t)} style={{
            background:Surface.Card, border:'none', borderRadius:Radius.card,
            padding:'14px 10px', cursor:'pointer', fontFamily:'inherit',
            display:'flex', flexDirection:'column', alignItems:'center', gap:Space.sm, minHeight:74 }}>
            <span style={{ fontSize:FontSize.Heading2 }}>{t.icon}</span>
            <span style={{ fontSize:FontSize.BodySmall, color:Text.Primary, textAlign:'center', lineHeight:1.3 }}>
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      <button onClick={() => { setType(null); setResults([]) }} style={{
        background:'none', border:'none', color:Accent, fontSize:FontSize.CardTitle,
        cursor:'pointer', fontFamily:'inherit', marginBottom:Space.xl, padding:0 }}>
        ← Back
      </button>
      <p style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Bold,
        color:Text.Primary, marginBottom:Space.xl }}>
        {type.icon} {type.label} — Best Dates
      </p>
      {results.length === 0 ? (
        <EmptyState icon="📅" title="Loading dates…" />
      ) : results.map((r, i) => {
        const ctx = buildDateContext(r.daysAhead)
        const isTop = i === 0
        return (
          <div key={i} style={{
            background: isTop ? `${Accent}15` : Surface.Card,
            border: isTop ? `1px solid ${Accent}44` : 'none',
            borderRadius:Radius.card, padding:Pad.card, marginBottom:Gap.card }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:Space.xs }}>
              <span style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Bold, color:Text.Primary }}>
                {isTop ? '★ ' : `${i+1}. `}{ctx.fullDate.replace(/,?\s*\d{4}$/, '')}
              </span>
              <ConfidenceBadge level={r.confidence} size={FontSize.Badge} />
            </div>
            {r.win && (
              <p style={{ fontSize:FontSize.Caption, color:Accent, fontWeight:FontWeight.Bold, marginBottom:Space.xs }}>
                ⏰ {r.win}
              </p>
            )}
            <StarRating value={r.stars} size={FontSize.Caption} />
          </div>
        )
      })}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PlannerScreen({ weeklyPlan, opportunities, daily, dateContext, onFetchFuture, onReturnToday }) {
  const [horizonDays, setHorizonDays] = useState(7)
  const [horizonData, setHorizonData] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState('upcoming')  // upcoming | plan
  const [selectedDay, setSelectedDay] = useState(null)

  // Derive users from daily.members to re-use for horizon fetch
  const users = useMemo(() => (daily?.members || []).map(m => ({
    name: m.name, dob:'', birth_time:'' // basic — enough for relative scores
  })), [daily])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setHorizonData([])
    fetchHorizon(users, horizonDays).then(data => {
      if (!cancelled) { setHorizonData(data); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [horizonDays])

  // Merge week_plan data for the first 7 days
  const mergedData = useMemo(() => {
    const wk = (daily?.week_plan || []).filter(d => d.days_ahead > 0)
    const horizon = horizonData.filter(d => d.daysAhead > 7)
    const wkMapped = wk.map(d => ({ daysAhead:d.days_ahead, stars:d.stars, golden_window:null,
      members:[{ stars:d.stars, confidence:d.confidence >= 70 ? 'High' : d.confidence >= 50 ? 'Medium' : 'Low',
        golden_window: null, focus: d.summary }] }))
    return [...wkMapped, ...horizon].sort((a,b) => a.daysAhead - b.daysAhead)
  }, [daily, horizonData])

  if (selectedDay) return (
    <div style={{ padding:`${Space['3xl']}px ${Space.xl}px` }}>
      <SelectedDayDetail dayData={selectedDay} onBack={() => setSelectedDay(null)} />
    </div>
  )

  return (
    <div style={{ padding:`${Space['3xl']}px ${Space.xl}px` }}>
      {/* Header */}
      <div style={{ marginBottom:Space.xl }}>
        <p style={{ fontSize:FontSize.Heading2, fontWeight:FontWeight.Heavy, color:Text.Primary, marginBottom:Space.xs }}>
          Plan Ahead
        </p>
        <p style={{ fontSize:FontSize.Caption, color:Text.Secondary }}>
          {dateContext?.weekLabel || 'This week'}
        </p>
      </div>

      {/* Horizon selector */}
      <div style={{ display:'flex', gap:Space.sm, marginBottom:Space.xl }}>
        {[7, 14].map(d => (
          <button key={d} onClick={() => setHorizonDays(d)} style={{
            background: horizonDays === d ? Accent : Surface.Card,
            color: horizonDays === d ? '#000' : Text.Secondary,
            border:'none', borderRadius:Radius.pill, padding:`6px 16px`,
            fontSize:FontSize.Caption, fontWeight:FontWeight.Bold,
            cursor:'pointer', fontFamily:'inherit', minHeight:32 }}>
            {d} days
          </button>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:Space.sm, marginBottom:Space.xl }}>
        <TabButton label="Upcoming windows" active={tab==='upcoming'} onClick={() => setTab('upcoming')} />
        <TabButton label="Plan something"   active={tab==='plan'}     onClick={() => setTab('plan')} />
      </div>

      {tab === 'upcoming' && (
        <div>
          {loading ? (
            <p style={{ fontSize:FontSize.Caption, color:Text.Secondary }}>Loading {horizonDays}-day horizon…</p>
          ) : mergedData.length === 0 ? (
            <EmptyState icon="📅" title="No horizon data" body="Could not load future guidance." />
          ) : (
            mergedData.map((d, i) => (
              <HorizonDay key={i} dayData={d} onSelect={setSelectedDay} />
            ))
          )}
        </div>
      )}

      {tab === 'plan' && (
        <PlanSomething horizonData={mergedData} />
      )}
    </div>
  )
}
