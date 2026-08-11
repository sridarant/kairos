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

// ─── Fetch horizon data from API ─────────────────────────────────────────────

async function fetchHorizon(users, days) {
  const results = []
  for (let i = 1; i <= days; i++) {
    try {
      const now = new Date()
      const base = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      base.setDate(base.getDate() + i)
      const yyyy = base.getFullYear()
      const mm   = String(base.getMonth()+1).padStart(2,'0')
      const dd   = String(base.getDate()).padStart(2,'0')
      const calculationDate = `${yyyy}-${mm}-${dd}`
      const res = await fetch('/api/daily', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ users:users||[], daysAhead:i, calculationDate })
      })
      if (res.ok) {
        const raw = await res.json()
        // DTO boundary: adapt raw API response through canonical adapter
        results.push(adaptHorizonDay({ ...raw, daysAhead:i, date:calculationDate }, i))
      }
    } catch { /* skip failed days */ }
  }
  return results
}

// ─── Activity selector ────────────────────────────────────────────────────────

const ACTIVITY_LIST = [
  { id:'conversation', label:'Conversation' },
  { id:'meeting',      label:'Meeting'       },
  { id:'career',       label:'Career'        },
  { id:'finance',      label:'Finance'       },
  { id:'purchase',     label:'Purchase'      },
  { id:'property',     label:'Property'      },
  { id:'travel',       label:'Travel'        },
  { id:'study',        label:'Study'         },
  { id:'family',       label:'Family'        },
  { id:'wellness',     label:'Wellness'      },
  { id:'medical_routine',  label:'Health check'     },
  { id:'medical_decision', label:'Medical decision'  },
  { id:'other',        label:'Other'         },
]

function ActivitySelector({ selected, onSelect }) {
  return (
    <div>
      <p style={{ fontSize:FontSize.Label, textTransform:'uppercase', letterSpacing:'0.08em',
        color:Text.Muted, fontWeight:FontWeight.Medium, marginBottom:Space.md }}>
        What are you planning?
      </p>
      <div style={{ display:'flex', flexWrap:'wrap', gap:Space.sm }}>
        {ACTIVITY_LIST.map(a => (
          <button key={a.id} onClick={() => onSelect(a.id)}
            style={{ padding:`6px ${Space.md}px`,
              background: selected===a.id ? Accent : Surface.Subtle,
              color: selected===a.id ? Text.Inverse : Text.Secondary,
              border:'none', borderRadius:Radius.pill, cursor:'pointer',
              fontFamily:'inherit', fontSize:FontSize.Caption,
              fontWeight: selected===a.id ? FontWeight.SemiBold : FontWeight.Regular,
              minHeight:40 }}>
            {a.label}
          </button>
        ))}
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
  const ctx = buildDateContext(result.daysAhead)
  const dimScore = result.bestDimScore
  const approx   = result.isApproximate

  return (
    <div style={{ marginBottom:Space.xl }}>
      <p style={{ fontSize:FontSize.Label, textTransform:'uppercase', letterSpacing:'0.08em',
        color:Text.Muted, fontWeight:FontWeight.Medium, marginBottom:Space.sm }}>
        {label}
      </p>
      <p style={{ fontSize:FontSize.Heading3, fontWeight:FontWeight.Bold, color:Text.Primary,
        marginBottom:Space.xs }}>
        {ctx.weekday}, {ctx.dayMonth}
      </p>

      {result.bestWindow && (
        <div style={{ display:'inline-flex', alignItems:'center', gap:Space.xs,
          background:Surface.Subtle, borderRadius:Radius.pill,
          padding:`4px ${Space.md}px`, marginBottom:Space.md }}>
          <span style={{ fontSize:12, color:Accent }}>●</span>
          <span style={{ fontSize:FontSize.Caption, color:Text.Primary, fontWeight:FontWeight.Medium }}>
            {result.bestWindow}
          </span>
        </div>
      )}

      {/* Why — from structured evidence */}
      {result.explanation?.why && (
        <p style={{ fontSize:FontSize.BodySmall, color:Text.Secondary,
          lineHeight:1.6, marginBottom:Space.sm }}>
          {result.explanation.why}
        </p>
      )}

      {/* Caution — if present */}
      {result.explanation?.caution && (
        <p style={{ fontSize:FontSize.Caption, color:Status.Caution,
          lineHeight:1.5 }}>
          ⚠ {result.explanation.caution}
        </p>
      )}

      {approx && (
        <p style={{ fontSize:FontSize.Badge, color:Text.Muted, marginTop:Space.xs }}>
          Approximate — full profile data unavailable for this day
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
        const ctx = buildDateContext(r.daysAhead)
        const scoreBar = Math.round(r.score / 100 * 8)  // visual width 0-8 chars
        return (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'130px 1fr auto',
            gap:Space.md, padding:`${Space.sm}px 0`,
            borderBottom:`1px solid ${Surface.Line}`, alignItems:'center' }}>
            <span style={{ fontSize:FontSize.Caption, color:Text.Primary, fontWeight:FontWeight.Medium }}>
              {ctx.weekday.slice(0,3)}, {ctx.shortDate}
            </span>
            <span style={{ fontSize:FontSize.Caption, color:Text.Secondary }}>
              {r.bestWindow || '—'}
            </span>
            <div style={{ display:'flex', gap:2 }}>
              {Array.from({length:5},(_,j)=>(
                <div key={j} style={{ width:4, height:12, borderRadius:2,
                  background: j < Math.round(r.score/20) ? Accent : Surface.Line }} />
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

  // Fetch horizon when days changes
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setHorizonData([])
    fetchHorizon(users, horizonDays).then(data => {
      if (!cancelled) { setHorizonData(data); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [horizonDays, JSON.stringify(users)])

  // Run canonical planning engine (not React business logic)
  const planResult = useMemo(() => {
    if (!activityId || !horizonData.length) return null
    return planActivity(horizonData, activityId, { maxResults:horizonDays })
  }, [activityId, horizonData])

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
          {/* Safety note */}
          <SafetyNote note={planResult.safetyNote} />

          {/* Best date */}
          {planResult.best && (
            <DayResult result={planResult.best} label="Best time" rank={1} />
          )}

          {/* Alternative */}
          {planResult.alternative && (
            <DayResult result={planResult.alternative} label="Alternative" rank={2} />
          )}

          {/* Divider */}
          <div style={{ borderTop:`1px solid ${Surface.Line}`, marginBottom:Space['3xl'] }} />

          {/* Full ranked list */}
          <HorizonList ranked={planResult.ranked} activityId={activityId} />
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
