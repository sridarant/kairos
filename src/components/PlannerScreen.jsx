/**
 * PlannerScreen v29.3
 * "When should I plan?" — answered within seconds.
 * Cleaner language, stronger planning hierarchy.
 */
import { useState } from 'react'
import { buildEventRecommendations } from '../../lib/recommendations/weeklyPlanner.js'
import {
  TabButton, StarRating, ConfidenceBadge, SectionTitle,
  StandardCard, EmptyState, FamilyCard
} from './common/index.jsx'
import { Surface, Text, Status, Accent, Radius, Space, Pad, Gap, FontSize, FontWeight, Z } from '../styles/tokens/index.js'

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

const TABS = [
  { id:'weekly',        label:'Week'   },
  { id:'opportunities', label:'Coming' },
  { id:'events',        label:'Plan'   },
  { id:'family',        label:'Family' }
]

function TabBar({ active, onSelect }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: Gap.sm, marginBottom: Space.xl }}>
      {TABS.map(t => <TabButton key={t.id} label={t.label} active={active === t.id} onClick={() => onSelect(t.id)} />)}
    </div>
  )
}

function WeeklyTab({ weeklyPlan, onFetchFuture }) {
  if (!weeklyPlan) return <EmptyState icon="📅" title="Building your week plan…" />
  return (
    <div>
      {weeklyPlan.topDay && (
        <div style={{ background: Surface.Card, borderRadius: Radius.card, padding: Pad.card, marginBottom: Space.md,
          border:`1px solid ${Accent}22` }}>
          <p style={{ fontSize: FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
            color: Accent, fontWeight: FontWeight.Medium, marginBottom: Space.xs }}>
            Best day this week
          </p>
          <p style={{ fontSize: FontSize.Heading3, fontWeight: FontWeight.Heavy, color: Text.Primary, marginBottom: Space.xs }}>
            {weeklyPlan.topDay.label}
          </p>
          <p style={{ fontSize: FontSize.Caption, color: Text.Secondary }}>{weeklyPlan.topDay.summary}</p>
        </div>
      )}

      <SectionTitle>Plan by Category</SectionTitle>
      {(weeklyPlan.categories || []).map((c, i) => (
        <div key={i} onClick={() => c.daysAhead > 0 && onFetchFuture?.(c.daysAhead)}
          style={{ background: Surface.Card, borderRadius: Radius.card, padding: Pad.card, marginBottom: Gap.card,
            cursor: c.daysAhead > 0 ? 'pointer' : 'default', display:'flex', alignItems:'center', gap: Space.md }}>
          <span style={{ fontSize: FontSize.Heading2, flexShrink:0 }}>{c.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom: Space.xs }}>
              <span style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold, color: Text.Primary }}>{c.label}</span>
              <span style={{ fontSize: FontSize.Body, color: Accent, fontWeight: FontWeight.Bold }}>{c.bestDay}</span>
            </div>
            <p style={{ fontSize: FontSize.Caption, color: Text.Secondary, lineHeight:1.4 }}>{c.summary}</p>
          </div>
          <ConfidenceBadge level={c.confidence} size={FontSize.Badge} />
        </div>
      ))}

      {weeklyPlan.challenging && (
        <div style={{ background:'rgba(248,113,113,0.07)', borderRadius: Radius.card, padding: Pad.card }}>
          <p style={{ fontSize: FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
            color: Status.Danger, fontWeight: FontWeight.Medium, marginBottom: Space.xs }}>
            Most challenging day
          </p>
          <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold, color: Text.Primary }}>
            {weeklyPlan.challenging.label}
          </p>
          <p style={{ fontSize: FontSize.Caption, color: Text.Secondary, marginTop: Space.xs }}>
            {weeklyPlan.challenging.summary || 'Rest and conserve energy.'}
          </p>
        </div>
      )}
    </div>
  )
}

function ComingTab({ opportunities, onFetchFuture }) {
  if (!opportunities?.length) return (
    <EmptyState icon="🔭" title="No upcoming windows identified" body="Check back once more of the week is analysed." />
  )
  return (
    <div>
      <p style={{ fontSize: FontSize.BodySmall, color: Text.Secondary, marginBottom: Space.md, lineHeight:1.6 }}>
        These are the strongest windows coming up. Plan important work around them.
      </p>
      {opportunities.map((o, i) => (
        <div key={i} onClick={() => o.daysAhead > 0 && onFetchFuture?.(o.daysAhead)}
          style={{ background: Surface.Card, borderRadius: Radius.card, padding: Pad.card,
            marginBottom: Gap.card, cursor:'pointer' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom: Space.xs }}>
            <span style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold, color: Text.Primary }}>
              {o.label}
            </span>
            <ConfidenceBadge level={o.confidence} />
          </div>
          <p style={{ fontSize: FontSize.Body, color: Text.Primary, marginBottom: Space.xs }}>{o.title}</p>
          <p style={{ fontSize: FontSize.Caption, color: Text.Secondary }}>{o.summary}</p>
          <div style={{ marginTop: Space.sm }}>
            <StarRating value={o.stars} size={FontSize.Caption} />
          </div>
        </div>
      ))}
    </div>
  )
}

function PlanTab({ weekPlanDays }) {
  const [selected, setSelected] = useState(null)
  const [results, setResults]   = useState(null)

  function handleSelect(type) {
    setSelected(type)
    setResults(buildEventRecommendations(type.id, weekPlanDays || []))
  }

  if (!selected) return (
    <div>
      <p style={{ fontSize: FontSize.BodySmall, color: Text.Secondary, marginBottom: Space.md, lineHeight:1.6 }}>
        What are you planning? Kairos will find your best dates.
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: Gap.grid }}>
        {EVENT_TYPES.map(t => (
          <button key={t.id} onClick={() => handleSelect(t)} style={{
            background: Surface.Card, border:'none', borderRadius: Radius.card, padding:'14px 10px',
            cursor:'pointer', fontFamily:'inherit', display:'flex', flexDirection:'column',
            alignItems:'center', gap: Space.sm, minHeight:80 }}>
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
      <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold, marginBottom: Space.md, color: Text.Primary }}>
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
        </div>
      ))}
    </div>
  )
}

function FamilyPlannerTab({ familyAlignment }) {
  if (!familyAlignment) return (
    <EmptyState icon="👨‍👩‍👧" title="Add family members" body="Set up your family in Settings to unlock family planning." />
  )
  return (
    <div>
      <p style={{ fontSize: FontSize.BodySmall, color: Text.Secondary, marginBottom: Space.md, lineHeight:1.6 }}>
        Based on your family's alignment today.
      </p>
      <FamilyCard
        energy={(familyAlignment.stars || 3) >= 4 ? 'High' : 'Moderate'}
        bestWindow={familyAlignment.best_shared_window || familyAlignment.bestSharedWindow}
        activity={familyAlignment.recommended?.[0]}
        caution={familyAlignment.avoid?.[0]} />
    </div>
  )
}

export default function PlannerScreen({ weeklyPlan, opportunities, daily, onFetchFuture, onClose }) {
  const [tab, setTab] = useState('weekly')
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background: Surface.Overlay,
        backdropFilter:'blur(4px)', zIndex: Z.overlay }} />
      <div className="slide-up" style={{
        position:'fixed', left:0, right:0, bottom:0, maxWidth:448, margin:'0 auto',
        maxHeight:'92vh', overflowY:'auto', background: Surface.Base,
        borderRadius: Radius.modal, zIndex: Z.modal }}>
        <div style={{ padding: Pad.modal }}>
          <div style={{ width:36, height:4, background: Surface.Line, borderRadius: Radius.sm,
            margin:`0 auto ${Space.xl}px` }} />
          <p style={{ fontSize: FontSize.Heading3, fontWeight: FontWeight.Bold, marginBottom: Space.xl, color: Text.Primary }}>
            Life Planner
          </p>
          <TabBar active={tab} onSelect={setTab} />
          {tab === 'weekly'        && <WeeklyTab weeklyPlan={weeklyPlan} onFetchFuture={onFetchFuture} />}
          {tab === 'opportunities' && <ComingTab opportunities={opportunities} onFetchFuture={onFetchFuture} />}
          {tab === 'events'        && <PlanTab weekPlanDays={daily?.week_plan} />}
          {tab === 'family'        && <FamilyPlannerTab familyAlignment={daily?.family_alignment} />}
        </div>
      </div>
    </>
  )
}
