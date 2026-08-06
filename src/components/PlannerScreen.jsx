/**
 * PlannerScreen v30.0 — Forward-planning workspace.
 *
 * Question answered: "When should I plan important activities?"
 * NOT a duplicate of Today's recommendations.
 *
 * Tabs:
 *   Week     — Best days per category this week
 *   Month    — Highlighted opportunity windows (no calendar grid)
 *   Plan     — Event planning assistant (pick event type → best dates)
 *   Timeline — Chronological planning horizon (week + soon + opportunities)
 */

import { useState, useMemo } from 'react'
import { buildEventRecommendations } from '../../lib/recommendations/weeklyPlanner.js'
import { TabButton, StarRating, ConfidenceBadge, SectionTitle, StandardCard, EmptyState } from './common/index.jsx'
import { Surface, Text, Status, Accent, Radius, Space, Pad, Gap, FontSize, FontWeight, Z } from '../styles/tokens/index.js'

// ─── Shared ───────────────────────────────────────────────────────────────────

const TABS = [
  { id:'week',     label:'Week'    },
  { id:'month',    label:'Outlook' },
  { id:'plan',     label:'Plan'    },
  { id:'timeline', label:'Horizon' }
]

const EVENT_TYPES = [
  { id:'interview',     label:'Interview',           icon:'💼' },
  { id:'travel',        label:'Travel',              icon:'✈️' },
  { id:'medical',       label:'Medical Appointment', icon:'🏥' },
  { id:'property',      label:'Property Decision',   icon:'🏠' },
  { id:'investment',    label:'Financial Decision',  icon:'💰' },
  { id:'temple',        label:'Spiritual Practice',  icon:'🛕' },
  { id:'family',        label:'Family Gathering',    icon:'👨‍👩‍👧' },
  { id:'communication', label:'Important Meeting',   icon:'💬' }
]

function TabBar({ active, onSelect }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: Gap.sm, marginBottom: Space.xl }}>
      {TABS.map(t => <TabButton key={t.id} label={t.label} active={active === t.id} onClick={() => onSelect(t.id)} />)}
    </div>
  )
}

// ─── Week Tab: best days per category ─────────────────────────────────────────
function WeekTab({ weeklyPlan, dateContext, onFetchFuture }) {
  if (!weeklyPlan) return <EmptyState icon="📅" title="Building your week plan…" />
  return (
    <div>
      {/* Context header */}
      <p style={{ fontSize: FontSize.Caption, color: Text.Secondary, marginBottom: Space.xl, textAlign:'center' }}>
        {dateContext?.weekLabel || 'This Week'}
      </p>

      {weeklyPlan.topDay && (
        <div style={{ background:`${Accent}11`, border:`1px solid ${Accent}33`,
          borderRadius: Radius.card, padding: Pad.card, marginBottom: Space.md }}>
          <p style={{ fontSize: FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
            color: Accent, fontWeight: FontWeight.Medium, marginBottom: Space.xs }}>
            Best day this week
          </p>
          <p style={{ fontSize: FontSize.Heading3, fontWeight: FontWeight.Heavy, color: Text.Primary }}>
            {weeklyPlan.topDay.label}
          </p>
          <p style={{ fontSize: FontSize.Caption, color: Text.Secondary, marginTop: Space.xs }}>
            {weeklyPlan.topDay.summary}
          </p>
        </div>
      )}

      <SectionTitle>By Category</SectionTitle>
      {(weeklyPlan.categories || []).map((c, i) => (
        <div key={i} onClick={() => c.daysAhead > 0 && onFetchFuture(c.daysAhead)}
          style={{ background: Surface.Card, borderRadius: Radius.card, padding: Pad.card,
            marginBottom: Gap.card, cursor: c.daysAhead > 0 ? 'pointer' : 'default',
            display:'flex', alignItems:'center', gap: Space.md }}>
          <span style={{ fontSize: FontSize.Heading2, flexShrink:0 }}>{c.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom: Space.xs }}>
              <span style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold, color: Text.Primary }}>{c.label}</span>
              <span style={{ fontSize: FontSize.Body, color: Accent, fontWeight: FontWeight.Bold }}>{c.bestDay}</span>
            </div>
            <p style={{ fontSize: FontSize.Caption, color: Text.Secondary }}>{c.summary}</p>
          </div>
          <ConfidenceBadge level={c.confidence} size={FontSize.Badge} />
        </div>
      ))}

      {weeklyPlan.challenging && (
        <div style={{ background:'rgba(248,113,113,0.07)', borderRadius: Radius.card, padding: Pad.card,
          marginTop: Space.sm }}>
          <p style={{ fontSize: FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
            color: Status.Danger, fontWeight: FontWeight.Medium, marginBottom: Space.xs }}>
            Most challenging — consider lighter plans
          </p>
          <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold, color: Text.Primary }}>
            {weeklyPlan.challenging.label}
          </p>
          {weeklyPlan.challenging.summary && (
            <p style={{ fontSize: FontSize.Caption, color: Text.Secondary, marginTop: Space.xs }}>
              {weeklyPlan.challenging.summary}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Month Tab: opportunity windows, not a full calendar ──────────────────────
function MonthTab({ weeklyPlan, opportunities, dateContext, onFetchFuture }) {
  const highlights = useMemo(() => {
    const days = (weeklyPlan?.days || []).filter(d => d.daysAhead > 0)
    const opp  = (opportunities || [])
    const all  = [
      ...opp.map(o => ({ label:o.label, summary:o.title, stars:o.stars, confidence:o.confidence, daysAhead:o.daysAhead, type:'opportunity' })),
      ...days.filter(d => d.stars >= 4).map(d => ({ label:d.label, summary:d.summary, stars:d.stars, confidence:d.confidenceLabel, daysAhead:d.daysAhead, type:'day' })),
      ...days.filter(d => d.stars <= 2).map(d => ({ label:d.label, summary:'Lighter plans recommended.', stars:d.stars, confidence:d.confidenceLabel, daysAhead:d.daysAhead, type:'caution' }))
    ]
    const seen = new Set()
    return all.filter(a => { if (seen.has(a.label)) return false; seen.add(a.label); return true })
      .sort((a,b) => a.daysAhead - b.daysAhead)
  }, [weeklyPlan, opportunities])

  if (!highlights.length) return <EmptyState icon="🗓" title="Building monthly outlook…" />

  return (
    <div>
      <p style={{ fontSize: FontSize.Caption, color: Text.Secondary, marginBottom: Space.xl, textAlign:'center' }}>
        {dateContext?.monthLabel || 'This Month'} · Meaningful windows only
      </p>
      {highlights.map((h, i) => (
        <div key={i} onClick={() => h.daysAhead > 0 && onFetchFuture(h.daysAhead)}
          style={{ display:'flex', gap: Space.md, padding: Pad.card,
            background: h.type === 'caution' ? 'rgba(248,113,113,0.06)' : Surface.Card,
            borderRadius: Radius.card, marginBottom: Gap.card,
            cursor: h.daysAhead > 0 ? 'pointer' : 'default',
            borderLeft: `3px solid ${h.type==='opportunity' ? Accent : h.type==='caution' ? Status.Danger : Status.Success}` }}>
          {/* Day callout */}
          <div style={{ flexShrink:0, minWidth:52, textAlign:'center' }}>
            <p style={{ fontSize: FontSize.Caption, color: h.type==='caution' ? Status.Danger : Accent,
              fontWeight: FontWeight.Bold, textTransform:'uppercase', letterSpacing:'0.06em' }}>
              {h.daysAhead === 0 ? 'Today' : h.daysAhead === 1 ? 'Tmrw' : `+${h.daysAhead}d`}
            </p>
            <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Heavy, color: Text.Primary }}>
              {h.label?.split(' ')[0]}
            </p>
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize: FontSize.BodySmall, color: Text.Primary, lineHeight:1.4, marginBottom: Space.xs }}>
              {h.summary}
            </p>
            <div style={{ display:'flex', alignItems:'center', gap: Space.sm }}>
              <StarRating value={h.stars} size={FontSize.Caption} />
              <ConfidenceBadge level={h.confidence} size={FontSize.Badge} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Plan Tab: event assistant ────────────────────────────────────────────────
function PlanTab({ weekPlanDays }) {
  const [selected, setSelected] = useState(null)
  const [results,  setResults]  = useState(null)

  function handleSelect(type) {
    setSelected(type)
    setResults(buildEventRecommendations(type.id, weekPlanDays || []))
  }

  if (!selected) return (
    <div>
      <p style={{ fontSize: FontSize.BodySmall, color: Text.Secondary, marginBottom: Space.md, lineHeight:1.6 }}>
        Select the type of activity you want to plan. Kairos will identify the best available windows.
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: Gap.grid }}>
        {EVENT_TYPES.map(t => (
          <button key={t.id} onClick={() => handleSelect(t)} style={{
            background: Surface.Card, border:'none', borderRadius: Radius.card, padding:'14px 10px',
            cursor:'pointer', fontFamily:'inherit', display:'flex', flexDirection:'column',
            alignItems:'center', gap: Space.sm, minHeight:78 }}>
            <span style={{ fontSize: FontSize.Heading2 }}>{t.icon}</span>
            <span style={{ fontSize: FontSize.BodySmall, color: Text.Primary, textAlign:'center', lineHeight:1.3 }}>
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      <button onClick={() => { setSelected(null); setResults(null) }} style={{
        background:'none', border:'none', color: Accent, fontSize: FontSize.CardTitle,
        cursor:'pointer', fontFamily:'inherit', marginBottom: Space.md, padding:0 }}>
        ← Back
      </button>
      <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold,
        marginBottom: Space.md, color: Text.Primary }}>
        {selected.icon} {selected.label} — Best Dates
      </p>
      {(results || []).map((r, i) => (
        <div key={i} style={{
          background: i === 0 ? `${Accent}15` : Surface.Card,
          border: i === 0 ? `1px solid ${Accent}44` : 'none',
          borderRadius: Radius.card, padding: Pad.card, marginBottom: Gap.card }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom: Space.xs }}>
            <span style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold, color: Text.Primary }}>
              {i === 0 ? '★ ' : `#${r.rank} `}{r.label}
            </span>
            <ConfidenceBadge level={r.confidence} />
          </div>
          <p style={{ fontSize: FontSize.Caption, color: Text.Secondary, marginBottom: Space.xs }}>{r.reason}</p>
          <StarRating value={r.stars} size={FontSize.Caption} />
          {r.calendarExport && (
            <p style={{ fontSize: FontSize.Badge, color: Accent, marginTop: Space.sm, opacity:.7 }}>
              {r.calendarExport.date}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Horizon Tab: chronological planning timeline ──────────────────────────────
function HorizonTab({ weeklyPlan, opportunities, onFetchFuture }) {
  const all = useMemo(() => {
    const wkDays = (weeklyPlan?.days || []).map(d => ({
      label: d.label, date: d.date, daysAhead: d.daysAhead, stars: d.stars,
      summary: d.summary, confidence: d.confidenceLabel, type: 'day'
    }))
    const opp = (opportunities || []).map(o => ({
      label: o.label, date: null, daysAhead: o.daysAhead, stars: o.stars,
      summary: o.summary || o.title, confidence: o.confidence, type: 'opportunity'
    }))
    const merged = [...wkDays, ...opp]
    const seen = new Set()
    return merged.filter(m => { const k = `${m.daysAhead}_${m.label}`; if (seen.has(k)) return false; seen.add(k); return true })
      .sort((a,b) => a.daysAhead - b.daysAhead)
  }, [weeklyPlan, opportunities])

  if (!all.length) return <EmptyState icon="⏱" title="Loading planning horizon…" />

  return (
    <div>
      <p style={{ fontSize: FontSize.Caption, color: Text.Secondary, marginBottom: Space.xl, textAlign:'center' }}>
        Next 7 days · All windows in order
      </p>
      <div style={{ position:'relative', paddingLeft:18 }}>
        <div style={{ position:'absolute', left:5, top:6, bottom:6, width:2,
          background: Surface.Line, borderRadius: Radius.sm }} />
        {all.map((d, i) => {
          const dotColor = d.stars >= 4 ? Accent : d.stars <= 2 ? Status.Danger : Text.Secondary
          return (
            <div key={i} onClick={() => d.daysAhead > 0 && onFetchFuture(d.daysAhead)}
              style={{ position:'relative', marginBottom: Space.md,
                cursor: d.daysAhead > 0 ? 'pointer' : 'default' }}>
              <div style={{ position:'absolute', left:-13, top:5, width:8, height:8,
                borderRadius:'50%', background: dotColor, border:'2px solid #000' }} />
              <div style={{ display:'flex', alignItems:'baseline', gap: Space.sm, marginBottom: Space.xs }}>
                <span style={{ fontSize: FontSize.BodySmall, fontWeight: FontWeight.Bold, color: dotColor }}>
                  {d.daysAhead === 0 ? 'Today' : d.daysAhead === 1 ? 'Tomorrow' : d.label}
                </span>
                <ConfidenceBadge level={d.confidence} size={FontSize.Badge} />
              </div>
              <p style={{ fontSize: FontSize.Caption, color: Text.Secondary, lineHeight:1.4 }}>{d.summary}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PlannerScreen({ weeklyPlan, opportunities, daily, dateContext, onFetchFuture, onClose, inline = false }) {
  const [tab, setTab] = useState('week')
  return (
    <>
      {!inline && <div onClick={onClose} style={{ position:'fixed', inset:0, background: Surface.Overlay,
        backdropFilter:'blur(4px)', zIndex: Z.overlay }} />}
      <div className={inline ? '' : 'slide-up'} style={inline ? {} : {
        position:'fixed', left:0, right:0, bottom:0, maxWidth:448, margin:'0 auto',
        maxHeight:'92vh', overflowY:'auto', background: Surface.Base,
        borderRadius: Radius.modal, zIndex: Z.modal }}>
        <div style={inline ? {} : { padding: Pad.modal }}>
          {!inline && <div style={{ width:36, height:4, background: Surface.Line, borderRadius: Radius.sm,
            margin:`0 auto ${Space.xl}px` }} />}
          <p style={{ fontSize: FontSize.Heading3, fontWeight: FontWeight.Bold,
            marginBottom: Space.xs, color: Text.Primary }}>
            Life Planner
          </p>
          <p style={{ fontSize: FontSize.Caption, color: Text.Secondary, marginBottom: Space.xl }}>
            When should I schedule activities?
          </p>
          <TabBar active={tab} onSelect={setTab} />
          {tab === 'week'     && <WeekTab weeklyPlan={weeklyPlan} dateContext={dateContext} onFetchFuture={onFetchFuture} />}
          {tab === 'month'    && <MonthTab weeklyPlan={weeklyPlan} opportunities={opportunities} dateContext={dateContext} onFetchFuture={onFetchFuture} />}
          {tab === 'plan'     && <PlanTab weekPlanDays={daily?.week_plan} />}
          {tab === 'timeline' && <HorizonTab weeklyPlan={weeklyPlan} opportunities={opportunities} onFetchFuture={onFetchFuture} />}
        </div>
      </div>
    </>
  )
}
