import { useState } from 'react'
import { buildEventRecommendations } from '../../lib/recommendations/weeklyPlanner.js'

const TRUST_COLOR = { High:'var(--green-txt,#4ade80)', Medium:'var(--amber-txt,#facc15)', Low:'var(--red-txt,#f87171)' }
const STARS = n => Array.from({length:5}, (_, i) => <span key={i} style={{opacity: i < n ? 1 : 0.2}}>★</span>)

const EVENT_TYPES = [
  { id:'interview',     label:'Interview',          icon:'💼' },
  { id:'travel',        label:'Travel',             icon:'✈️' },
  { id:'medical',       label:'Medical',            icon:'🏥' },
  { id:'property',      label:'Property',           icon:'🏠' },
  { id:'investment',    label:'Investment',         icon:'💰' },
  { id:'temple',        label:'Temple / Spiritual', icon:'🛕' },
  { id:'family',        label:'Family Function',    icon:'👨‍👩‍👧' },
  { id:'communication', label:'Important Meeting',  icon:'💬' }
]

function TabBar({ tabs, active, onSelect }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${tabs.length},1fr)`, gap:4, marginBottom:16 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onSelect(t.id)} style={{
          background: active === t.id ? 'var(--yellow)' : 'var(--gray-2)',
          color: active === t.id ? '#000' : 'var(--gray-4)',
          border:'none', borderRadius:10, padding:'9px 4px', fontSize:11, fontWeight:600,
          cursor:'pointer', fontFamily:'inherit', minHeight:36
        }}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ─── Weekly tab ────────────────────────────────────────────────────────────────
function WeeklyTab({ weeklyPlan, onFetchFuture }) {
  if (!weeklyPlan) {
    return <p style={{ color:'var(--gray-4)', fontSize:13, textAlign:'center', paddingTop:32 }}>Loading weekly plan…</p>
  }
  return (
    <div>
      {weeklyPlan.topDay && (
        <div style={{ background:'var(--gray-2)', borderRadius:12, padding:'12px 14px', marginBottom:10 }}>
          <p style={{ fontSize:10, color:'var(--yellow)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Best Day This Week</p>
          <p style={{ fontSize:18, fontWeight:700, marginBottom:2 }}>{weeklyPlan.topDay.label}</p>
          <p style={{ fontSize:12, color:'var(--gray-4)' }}>{weeklyPlan.topDay.summary}</p>
        </div>
      )}
      <p style={{ fontSize:12, color:'var(--gray-4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Best Day Per Category</p>
      {(weeklyPlan.categories || []).map((c, i) => (
        <div key={i}
          onClick={() => c.daysAhead > 0 && onFetchFuture?.(c.daysAhead)}
          style={{ background:'var(--gray-2)', borderRadius:12, padding:'11px 14px', marginBottom:6,
            cursor: c.daysAhead > 0 ? 'pointer' : 'default', display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:20, flexShrink:0 }}>{c.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
              <span style={{ fontSize:13, fontWeight:600 }}>{c.label}</span>
              <span style={{ fontSize:11, color:'var(--yellow)', fontWeight:600 }}>{c.bestDay}</span>
            </div>
            <p style={{ fontSize:11, color:'var(--gray-4)', lineHeight:1.4 }}>{c.summary}</p>
          </div>
          <span style={{ fontSize:10, color:TRUST_COLOR[c.confidence], flexShrink:0 }}>{c.confidence}</span>
        </div>
      ))}
      {weeklyPlan.challenging && (
        <div style={{ background:'var(--gray-2)', borderRadius:12, padding:'11px 14px', marginTop:4 }}>
          <p style={{ fontSize:10, color:'var(--red-txt,#f87171)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Most Challenging Day</p>
          <p style={{ fontSize:13, fontWeight:600 }}>{weeklyPlan.challenging.label}</p>
          <p style={{ fontSize:11, color:'var(--gray-4)' }}>{weeklyPlan.challenging.summary}</p>
        </div>
      )}
    </div>
  )
}

// ─── Opportunities tab ────────────────────────────────────────────────────────
function OpportunitiesTab({ opportunities, onFetchFuture }) {
  if (!opportunities?.length) {
    return <p style={{ color:'var(--gray-4)', fontSize:13, textAlign:'center', paddingTop:32 }}>No upcoming opportunities identified.</p>
  }
  return (
    <div>
      <p style={{ fontSize:12, color:'var(--gray-4)', marginBottom:10, lineHeight:1.5 }}>
        These windows have the strongest conditions in the coming week.
      </p>
      {opportunities.map((o, i) => (
        <div key={i}
          onClick={() => o.daysAhead > 0 && onFetchFuture?.(o.daysAhead)}
          style={{ background:'var(--gray-2)', borderRadius:12, padding:'12px 14px', marginBottom:8, cursor:'pointer' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ fontSize:13, fontWeight:700 }}>{o.label}</span>
            <span style={{ fontSize:11, color:TRUST_COLOR[o.confidence], fontWeight:600 }}>{o.confidence}</span>
          </div>
          <p style={{ fontSize:13, color:'var(--white,#fff)', marginBottom:3 }}>{o.title}</p>
          <p style={{ fontSize:11, color:'var(--gray-4)' }}>{o.summary}</p>
          <div style={{ marginTop:6, fontSize:12 }}>{STARS(o.stars)}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Events tab ───────────────────────────────────────────────────────────────
function EventTab({ weekPlanDays }) {
  const [selected, setSelected] = useState(null)
  const [results, setResults]   = useState(null)

  function handleSelect(type) {
    setSelected(type)
    setResults(buildEventRecommendations(type.id, weekPlanDays || []))
  }

  if (!selected) {
    return (
      <div>
        <p style={{ fontSize:13, color:'var(--gray-4)', marginBottom:12, lineHeight:1.5 }}>Select an event type to find the best days.</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {EVENT_TYPES.map(t => (
            <button key={t.id} onClick={() => handleSelect(t)} style={{
              background:'var(--gray-2)', border:'none', borderRadius:12, padding:'14px 10px',
              cursor:'pointer', fontFamily:'inherit', display:'flex', flexDirection:'column',
              alignItems:'center', gap:6, minHeight:80
            }}>
              <span style={{ fontSize:22 }}>{t.icon}</span>
              <span style={{ fontSize:12, color:'#ddd', textAlign:'center', lineHeight:1.3 }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <button onClick={() => { setSelected(null); setResults(null) }} style={{
        background:'none', border:'none', color:'var(--yellow)', fontSize:13,
        cursor:'pointer', fontFamily:'inherit', marginBottom:12, padding:0
      }}>
        ← Back
      </button>
      <p style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>{selected.icon} {selected.label} — Best Dates</p>
      {(results || []).map((r, i) => (
        <div key={i} style={{
          background: i === 0 ? 'rgba(250,204,21,0.1)' : 'var(--gray-2)',
          border: i === 0 ? '1px solid rgba(250,204,21,0.3)' : 'none',
          borderRadius:12, padding:'12px 14px', marginBottom:8
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
            <span style={{ fontSize:13, fontWeight:700 }}>#{r.rank} {r.label}</span>
            <span style={{ fontSize:11, color:TRUST_COLOR[r.confidence], fontWeight:600 }}>{r.confidence}</span>
          </div>
          <p style={{ fontSize:11, color:'var(--gray-4)', marginBottom:4 }}>{r.reason}</p>
          <div style={{ fontSize:12 }}>{STARS(r.stars)}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Family tab ───────────────────────────────────────────────────────────────
function FamilyPlannerTab({ familyAlignment }) {
  if (!familyAlignment) {
    return (
      <p style={{ color:'var(--gray-4)', fontSize:13, textAlign:'center', paddingTop:32 }}>
        Add family members to enable Family Planning.
      </p>
    )
  }
  return (
    <div>
      <div style={{ background:'var(--gray-2)', borderRadius:12, padding:'12px 14px', marginBottom:10 }}>
        <p style={{ fontSize:10, color:'var(--gray-4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Family Alignment</p>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
          <span style={{ fontSize:13 }}>Harmony</span>
          <span style={{ fontSize:13, fontWeight:700, color:TRUST_COLOR[familyAlignment.confidence || 'Medium'] }}>{familyAlignment.confidence || 'Medium'}</span>
        </div>
        {familyAlignment.best_shared_window && (
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ fontSize:13 }}>Best window</span>
            <span style={{ fontSize:13, color:'var(--yellow)', fontWeight:600 }}>{familyAlignment.best_shared_window}</span>
          </div>
        )}
        {familyAlignment.recommended?.length > 0 && (
          <div style={{ marginTop:6 }}>
            <p style={{ fontSize:11, color:'var(--gray-4)', marginBottom:4 }}>Recommended activities</p>
            {familyAlignment.recommended.map((a, i) => (
              <p key={i} style={{ fontSize:12, color:'var(--white,#fff)', marginBottom:2 }}>✓ {a}</p>
            ))}
          </div>
        )}
        {familyAlignment.avoid?.length > 0 && (
          <div style={{ marginTop:8 }}>
            <p style={{ fontSize:11, color:'var(--red-txt,#f87171)', marginBottom:4 }}>Be Mindful</p>
            {familyAlignment.avoid.map((a, i) => (
              <p key={i} style={{ fontSize:12, color:'var(--gray-4)', marginBottom:2 }}>⚠ {a}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id:'weekly',        label:'Week'   },
  { id:'opportunities', label:'Soon'   },
  { id:'events',        label:'Events' },
  { id:'family',        label:'Family' }
]

export default function PlannerScreen({ weeklyPlan, opportunities, daily, onFetchFuture, onClose }) {
  const [tab, setTab] = useState('weekly')
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', zIndex:40 }} />
      <div className="slide-up" style={{
        position:'fixed', left:0, right:0, bottom:0, maxWidth:448, margin:'0 auto',
        maxHeight:'92vh', overflowY:'auto', background:'var(--gray-1)', borderRadius:'20px 20px 0 0', zIndex:50
      }}>
        <div style={{ padding:'24px 16px 100px' }}>
          <div style={{ width:36, height:4, background:'var(--gray-3)', borderRadius:2, margin:'0 auto 16px' }} />
          <h2 style={{ fontSize:18, fontWeight:700, marginBottom:16 }}>Life Planner</h2>
          <TabBar tabs={TABS} active={tab} onSelect={setTab} />
          {tab === 'weekly'        && <WeeklyTab weeklyPlan={weeklyPlan} onFetchFuture={onFetchFuture} />}
          {tab === 'opportunities' && <OpportunitiesTab opportunities={opportunities} onFetchFuture={onFetchFuture} />}
          {tab === 'events'        && <EventTab weekPlanDays={daily?.week_plan} />}
          {tab === 'family'        && <FamilyPlannerTab familyAlignment={daily?.family_alignment} />}
        </div>
      </div>
    </>
  )
}
