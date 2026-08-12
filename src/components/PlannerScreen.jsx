/**
 * PlannerScreen v30.9 — Activity-based planning workspace.
 *
 * Constitution §5: No business logic in React.
 * All ranking/explanation done in lib/planning/activityPlanner.js.
 * This component: fetches data, calls canonical engine, renders results.
 *
 * Plan Something:
 *   - Selected activity actually changes scoring
 *   - Same date ranks differently for different activities
 *   - Explanations trace to engine reason codes
 *   - Medical/financial safety notes surfaced automatically
 */
import { useState, useEffect, useMemo } from 'react'
import { ACTIVITY_TYPES, planActivity } from '../../lib/planning/activityPlanner.js'
import { adaptHorizonDay } from '../../lib/adapters/PlannerHorizonAdapter.js'
import { Surface, Text, Accent, Status } from '../styles/tokens/index.js'
import { Space, FontSize, FontWeight, Radius } from '../styles/tokens/index.js'
import { EmptyState } from './common/index.jsx'
import { buildDateContext } from '../app/bootstrap/BootstrapManager.js'

// ─── Fetch horizon data — ONE /api/horizon request ───────────────────────────
// R2.3: replaces N sequential /api/daily calls with a single /api/horizon call.
// Before: 7-day → 7 calls × 8 calc-days each = 56 day-calculations (serial).
// After:  7-day → 1 call × 7 calc-days       = 7  day-calculations.

async function fetchHorizon(users, days, activityType) {
  try {
    const now  = new Date()
    const yyyy = now.getFullYear()
    const mm   = String(now.getMonth()+1).padStart(2,'0')
    const dd   = String(now.getDate()).padStart(2,'0')
    const startDate = `${yyyy}-${mm}-${dd}`

    const res = await fetch('/api/horizon', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ users:users||[], days, startDate, activityType: activityType||null })
    })

    if (!res.ok) return { days:[], bestDate:null, alternateDate:null, error:`HTTP ${res.status}` }

    const data = await res.json()
    // DTO boundary: adapt each day through canonical adapter
    const adaptedDays = (data.days || []).map(raw => {
      if (raw.status === 'failed') return { ...raw, _failed:true }
      return adaptHorizonDay(raw, raw.daysAhead)
    })

    return {
      days:          adaptedDays,
      bestDate:      data.bestDate  ? adaptHorizonDay(data.bestDate,  data.bestDate.daysAhead)  : null,
      alternateDate: data.alternateDate ? adaptHorizonDay(data.alternateDate, data.alternateDate.daysAhead) : null,
      activityType:  data.activityType,
      activityLabel: data.activityLabel,
      meta:          data.meta,
    }
  } catch (err) {
    return { days:[], bestDate:null, alternateDate:null, error:err?.message }
  }
}

// ─── Activity grouping (P1 — progressive disclosure) ─────────────────────────
// Groups prevent a 13-item flat list. Expanding one group at a time.

const ACTIVITY_GROUPS = [
  {
    id:'work', label:'Work',
    items:[
      { id:'career',       label:'Career decision' },
      { id:'meeting',      label:'Important meeting' },
      { id:'conversation', label:'Conversation' },
    ]
  },
  {
    id:'money', label:'Money',
    items:[
      { id:'finance',  label:'Financial decision' },
      { id:'purchase', label:'Major purchase' },
      { id:'property', label:'Property' },
    ]
  },
  {
    id:'personal', label:'Personal',
    items:[
      { id:'family',   label:'Family activity' },
      { id:'travel',   label:'Travel' },
      { id:'wellness', label:'Wellness' },
      { id:'study',    label:'Study' },
    ]
  },
  {
    id:'health', label:'Health',
    items:[
      { id:'medical_routine',  label:'Health check' },
      { id:'medical_decision', label:'Medical decision' },
    ]
  },
]

function ActivitySelector({ selected, onSelect }) {
  const [openGroup, setOpenGroup] = useState(null)

  // Auto-open the group containing the selected activity
  const selectedGroup = ACTIVITY_GROUPS.find(g => g.items.some(i => i.id === selected))?.id || null

  return (
    <div>
      <p style={{ fontSize:FontSize.Label, textTransform:'uppercase', letterSpacing:'0.08em',
        color:Text.Muted, fontWeight:FontWeight.Medium, marginBottom:Space.md }}>
        What are you planning?
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:Space.sm }}>
        {ACTIVITY_GROUPS.map(group => {
          const isOpen  = openGroup === group.id || selectedGroup === group.id
          const hasSelected = group.items.some(i => i.id === selected)
          return (
            <div key={group.id}>
              {/* Group header */}
              <button
                onClick={() => setOpenGroup(isOpen && !hasSelected ? null : group.id)}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                  width:'100%', padding:`${Space.sm}px ${Space.md}px`,
                  background: hasSelected ? `${Accent}18` : Surface.Subtle,
                  border: hasSelected ? `1px solid ${Accent}44` : `1px solid transparent`,
                  borderRadius:Radius.lg, cursor:'pointer', fontFamily:'inherit',
                  fontSize:FontSize.Caption, fontWeight:FontWeight.Medium,
                  color: hasSelected ? Accent : Text.Secondary, minHeight:40,
                  textAlign:'left' }}>
                <span>{group.label}</span>
                <span style={{ fontSize:10, opacity:0.6 }}>{isOpen ? '▲' : '▼'}</span>
              </button>
              {/* Items — shown when group is open */}
              {isOpen && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:Space.xs,
                  padding:`${Space.sm}px 0 ${Space.xs}px ${Space.md}px` }}>
                  {group.items.map(item => (
                    <button key={item.id}
                      onClick={() => { onSelect(item.id); setOpenGroup(group.id) }}
                      style={{ padding:`5px ${Space.md}px`,
                        background: selected===item.id ? Accent : Surface.Card,
                        color: selected===item.id ? Text.Inverse : Text.Secondary,
                        border:`1px solid ${selected===item.id ? Accent : Surface.Line}`,
                        borderRadius:Radius.pill, cursor:'pointer', fontFamily:'inherit',
                        fontSize:FontSize.Caption, minHeight:36 }}>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Plan result display ──────────────────────────────────────────────────────

function SafetyNote({ note }) {
  if (!note) return null
  return (
    <div style={{ borderLeft:`3px solid ${Status.Caution}`, paddingLeft:Space.md,
      marginBottom:Space.xl }}>
      <p style={{ fontSize:FontSize.Caption, color:Text.Secondary, lineHeight:1.5 }}>
        {note}
      </p>
    </div>
  )
}

function DayResult({ result, label, rank }) {
  if (!result) return null
  const ctx = buildDateContext(result.daysAhead)
  // P0: distinguish best date from best window clearly
  const bestWindow = result.activityWindow || result.bestWindow || result.golden_window
  const approx     = result.activityApprox || result.isApproximate

  if (result._failed || result.status === 'failed') {
    // P0: surfaced (not silently skipped)
    return (
      <div style={{ marginBottom:Space.xl }}>
        <p style={{ fontSize:FontSize.Label, textTransform:'uppercase', letterSpacing:'0.08em',
          color:Text.Muted, fontWeight:FontWeight.Medium, marginBottom:Space.sm }}>{label}</p>
        <p style={{ fontSize:FontSize.BodySmall, color:Text.Muted }}>
          {result.date} — calculation unavailable
        </p>
      </div>
    )
  }

  return (
    <div style={{ marginBottom:Space.xl }}>
      {/* Label: "Best date" or "Alternative" */}
      <p style={{ fontSize:FontSize.Label, textTransform:'uppercase', letterSpacing:'0.08em',
        color:Text.Muted, fontWeight:FontWeight.Medium, marginBottom:Space.xs }}>
        {label}
      </p>
      {/* Best date: weekday + calendar date */}
      <p style={{ fontSize:FontSize.Heading3, fontWeight:FontWeight.Bold, color:Text.Primary,
        marginBottom:Space.xs }}>
        {ctx.weekday}, {ctx.dayMonth}
      </p>
      {/* Best window: explicit time range */}
      {bestWindow && (
        <div style={{ marginBottom:Space.md }}>
          <p style={{ fontSize:FontSize.Badge, textTransform:'uppercase', letterSpacing:'0.07em',
            color:Text.Muted, marginBottom:2 }}>Best window</p>
          <div style={{ display:'inline-flex', alignItems:'center', gap:Space.xs,
            background:Surface.Subtle, borderRadius:Radius.pill,
            padding:`4px ${Space.md}px` }}>
            <span style={{ fontSize:10, color:Accent }}>●</span>
            <span style={{ fontSize:FontSize.Caption, color:Text.Primary, fontWeight:FontWeight.Medium }}>
              {bestWindow}
            </span>
          </div>
        </div>
      )}
      {/* Why — from engine evidence (never invented) */}
      {result.explanation?.why && (
        <p style={{ fontSize:FontSize.BodySmall, color:Text.Secondary, lineHeight:1.6, marginBottom:Space.sm }}>
          {result.explanation.why}
        </p>
      )}
      {/* Confidence */}
      {result.explanation?.confidence && (
        <p style={{ fontSize:FontSize.Caption, color:Text.Muted, marginBottom:Space.xs }}>
          Confidence: {result.explanation.confidence}
        </p>
      )}
      {/* Caution */}
      {result.explanation?.caution && (
        <p style={{ fontSize:FontSize.Caption, color:Status.Caution, lineHeight:1.5 }}>
          ⚠ {result.explanation.caution}
        </p>
      )}
      {approx && (
        <p style={{ fontSize:FontSize.Badge, color:Text.Muted, marginTop:Space.xs }}>
          Approximate — full profile unavailable
        </p>
      )}
    </div>
  )
}

// ─── Horizon day list ─────────────────────────────────────────────────────────

function HorizonList({ ranked, activityId }) {
  if (!ranked?.length) return null
  return (
    <div>
      <p style={{ fontSize:FontSize.Label, textTransform:'uppercase', letterSpacing:'0.08em',
        color:Text.Muted, fontWeight:FontWeight.Medium, marginBottom:Space.md }}>
        All dates
      </p>
      {ranked.map((r, i) => {
        if (r._failed || r.status === 'failed') {
          return (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'130px 1fr',
              gap:Space.md, padding:`${Space.sm}px 0`,
              borderBottom:`1px solid ${Surface.Line}`, alignItems:'center', opacity:0.4 }}>
              <span style={{ fontSize:FontSize.Caption, color:Text.Muted }}>{r.date}</span>
              <span style={{ fontSize:FontSize.Caption, color:Text.Muted }}>Unavailable</span>
            </div>
          )
        }
        const ctx = buildDateContext(r.daysAhead)
        const win = r.activityWindow || r.bestWindow || r.golden_window
        const score = r.activityScore ?? r.suitabilityScore ?? r.score ?? 0
        return (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'130px 1fr auto',
            gap:Space.md, padding:`${Space.sm}px 0`,
            borderBottom:`1px solid ${Surface.Line}`, alignItems:'center' }}>
            <span style={{ fontSize:FontSize.Caption, color:Text.Primary, fontWeight:FontWeight.Medium }}>
              {ctx.weekday.slice(0,3)}, {ctx.shortDate}
            </span>
            <span style={{ fontSize:FontSize.Caption, color:Text.Secondary }}>
              {win || '—'}
            </span>
            <div style={{ display:'flex', gap:2 }}>
              {Array.from({length:5},(_,j)=>(
                <div key={j} style={{ width:4, height:12, borderRadius:2,
                  background: j < Math.round(score/20) ? Accent : Surface.Line }} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PlannerScreen({
  weeklyPlan, opportunities, daily, dateContext, allUsers,
  onFetchFuture, onReturnToday
}) {
  const [activityId,  setActivityId]  = useState(null)
  const [horizonDays, setHorizonDays] = useState(7)
  const [horizonData, setHorizonData] = useState([])
  const [loading,     setLoading]     = useState(false)

  // Use canonical allUsers from identity (P0-05/P0-08 fix)
  const users = useMemo(() => {
    if (allUsers?.length) return allUsers
    return (daily?.members || []).map(m => ({ name:m.name, dob:'', birth_time:'' }))
  }, [allUsers, daily])

  // Fetch horizon — ONE /api/horizon call when days or activity changes
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setHorizonData(null)
    fetchHorizon(users, horizonDays, activityId).then(result => {
      if (!cancelled) { setHorizonData(result); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [horizonDays, activityId, JSON.stringify(users)])

  // planResult comes from the API response (not re-computed in React)
  // For local re-ranking when activityId changes before a new fetch completes,
  // we use the lib engine — this is the ONLY place planActivity is called.
  const planResult = useMemo(() => {
    if (!horizonData?.days?.length) return null
    // If API returned bestDate for the current activity, use it directly
    if (activityId && horizonData.bestDate) return horizonData
    // Fallback: rank locally using canonical lib function (no HTTP, same engine)
    if (!activityId) return horizonData
    return planActivity(horizonData.days, activityId, { maxResults:horizonDays })
  }, [activityId, horizonData, horizonDays])

  return (
    <div style={{ padding:`${Space['3xl']}px ${Space.xl}px`,
      minHeight:'100%', background:Surface.Background }}>

      {/* Header */}
      <div style={{ marginBottom:Space['3xl'] }}>
        <p style={{ fontSize:FontSize.Caption, color:Text.Muted, marginBottom:Space.xs }}>
          {dateContext?.weekLabel || 'This week'}
        </p>
        <p style={{ fontSize:FontSize.Heading2, fontWeight:FontWeight.Bold, color:Text.Primary }}>
          Plan Ahead
        </p>
      </div>

      {/* Horizon toggle */}
      <div style={{ display:'flex', gap:Space.sm, marginBottom:Space['3xl'] }}>
        {[7, 14].map(d => (
          <button key={d} onClick={() => setHorizonDays(d)}
            style={{ padding:`5px ${Space.md}px`,
              background: horizonDays===d ? Accent : Surface.Subtle,
              color: horizonDays===d ? Text.Inverse : Text.Secondary,
              border:'none', borderRadius:Radius.pill, cursor:'pointer',
              fontSize:FontSize.Caption, fontFamily:'inherit', minHeight:40 }}>
            {d} days
          </button>
        ))}
      </div>

      {/* Activity selector */}
      <div style={{ marginBottom:Space['3xl'] }}>
        <ActivitySelector selected={activityId} onSelect={setActivityId} />
      </div>

      {loading && (
        <p style={{ fontSize:FontSize.Caption, color:Text.Muted }}>
          Loading {horizonDays}-day horizon…
        </p>
      )}

      {/* Results */}
      {planResult && !loading && (
        <div>
          {/* Safety note — from canonical activity definition */}
          {activityId && ACTIVITY_TYPES[activityId]?.safetyNote && (
            <SafetyNote note={ACTIVITY_TYPES[activityId].safetyNote} />
          )}

          {/* Best date / best window */}
          {(planResult.bestDate || planResult.best) && (
            <DayResult result={planResult.bestDate || planResult.best} label="Best date" rank={1} />
          )}

          {/* Alternative date / window */}
          {(planResult.alternateDate || planResult.alternative) && (
            <DayResult result={planResult.alternateDate || planResult.alternative} label="Alternative" rank={2} />
          )}

          {/* Divider */}
          <div style={{ borderTop:`1px solid ${Surface.Line}`, marginBottom:Space['3xl'] }} />

          {/* Full list */}
          <HorizonList ranked={planResult.days || planResult.ranked} activityId={activityId} />
        </div>
      )}

      {/* Prompt when no activity selected */}
      {!activityId && !loading && (
        <p style={{ fontSize:FontSize.BodySmall, color:Text.Muted, lineHeight:1.6 }}>
          Select what you are planning above to see the best dates and windows, ranked for that activity.
        </p>
      )}
    </div>
  )
}
