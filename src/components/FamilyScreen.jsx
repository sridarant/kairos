/**
 * FamilyScreen v30.3.2 — Family Intelligence Workspace.
 *
 * Two perspectives:
 *   A. Family Overview — combined outlook and shared windows
 *   B. Individual Member View — per-member timeline/recommendations
 *      with a member switcher (tab bar)
 */
import { useState } from 'react'
import { SectionTitle, StarRating, ConfidenceBadge, StandardCard, EmptyState, TabButton } from './common/index.jsx'
import { Surface, Text, Status, Accent, Radius, Space, Pad, Gap, FontSize, FontWeight, Z } from '../styles/tokens/index.js'

// ─── Family Overview ──────────────────────────────────────────────────────────

function FamilyOverview({ brief, daily, dateContext, onFetchFuture }) {
  const fb = brief?.familyBrief
  const fa = daily?.family_alignment
  const energy     = fb?.energy || (fa?.stars >= 4 ? 'High' : 'Moderate')
  const bestWindow = fb?.bestWindow || fa?.best_shared_window || fa?.bestSharedWindow
  const activities = fb?.activities || fa?.recommended || []
  const cautions   = fb?.avoid      || fa?.avoid       || []
  const moodColor  = energy === 'High' ? Status.Success : Accent

  const upcomingGood = (daily?.week_plan || [])
    .filter(d => d.days_ahead > 0 && d.stars >= 4).slice(0, 3)

  return (
    <div>
      {/* Mood card */}
      <div style={{ background:Surface.Card, borderRadius:Radius['2xl'], padding:'20px 18px', marginBottom:Space.sm }}>
        <p style={{ fontSize:FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
          color:Text.Secondary, fontWeight:FontWeight.Medium, marginBottom:Space.sm }}>
          Today's Family — {dateContext?.weekday}, {dateContext?.dayMonth}
        </p>
        <div style={{ display:'flex', alignItems:'center', gap:Space.md, marginBottom:Space.md }}>
          <span style={{ fontSize:32 }}>👨‍👩‍👧</span>
          <div>
            <p style={{ fontSize:FontSize.Heading3, fontWeight:FontWeight.Bold, color:moodColor }}>
              {energy === 'High' ? 'Strong Harmony' : 'Steady Energy'}
            </p>
            <p style={{ fontSize:FontSize.Caption, color:Text.Secondary }}>
              {energy === 'High'
                ? 'Everyone is aligned — a great day for shared activities.'
                : 'Energy is moderate — keep plans relaxed.'}
            </p>
          </div>
        </div>

        {bestWindow && (
          <div style={{ background:`${Accent}11`, borderRadius:Radius.lg, padding:'9px 12px', marginBottom:Space.sm }}>
            <p style={{ fontSize:FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
              color:Text.Secondary, fontWeight:FontWeight.Medium, marginBottom:Space.xs }}>
              Best Time Together
            </p>
            <p style={{ fontSize:FontSize.Heading2, fontWeight:FontWeight.Heavy, color:Accent }}>{bestWindow}</p>
          </div>
        )}

        {activities.length > 0 && (
          <div style={{ marginBottom:Space.sm }}>
            <p style={{ fontSize:FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
              color:Text.Secondary, fontWeight:FontWeight.Medium, marginBottom:Space.sm }}>
              Recommended Together
            </p>
            {activities.slice(0,3).map((a,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:Space.sm,
                padding:'7px 0', borderBottom: i<2 ? `1px solid ${Surface.Line}` : 'none' }}>
                <span style={{ fontSize:16 }}>✦</span>
                <p style={{ fontSize:FontSize.Body, color:Text.Primary }}>{a}</p>
              </div>
            ))}
          </div>
        )}

        {cautions.length > 0 && (
          <div style={{ background:'rgba(248,113,113,0.06)', borderRadius:Radius.lg, padding:'9px 12px' }}>
            <p style={{ fontSize:FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
              color:Status.Danger, fontWeight:FontWeight.Medium, marginBottom:Space.xs }}>
              Worth Noting
            </p>
            {cautions.slice(0,2).map((c,i) => (
              <p key={i} style={{ fontSize:FontSize.BodySmall, color:Text.Secondary, lineHeight:1.4 }}>{c}</p>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming shared windows */}
      {upcomingGood.length > 0 && (
        <>
          <SectionTitle>Upcoming Good Windows</SectionTitle>
          {upcomingGood.map((d,i) => (
            <div key={i} onClick={() => onFetchFuture?.(d.days_ahead)}
              style={{ display:'flex', gap:Space.md, padding:Pad.card, background:Surface.Card,
                borderRadius:Radius.card, marginBottom:Gap.card, cursor:'pointer' }}>
              <div style={{ flexShrink:0, textAlign:'center', minWidth:48 }}>
                <p style={{ fontSize:FontSize.Caption, color:Accent, fontWeight:FontWeight.Bold,
                  textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  {d.days_ahead===1?'Tmrw':`+${d.days_ahead}d`}
                </p>
                <p style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Heavy, color:Text.Primary }}>
                  {d.label?.split(' ')[0]}
                </p>
              </div>
              <div style={{ width:1, background:Surface.Line }} />
              <div style={{ flex:1 }}>
                <p style={{ fontSize:FontSize.BodySmall, color:Text.Primary, marginBottom:Space.xs }}>{d.summary}</p>
                <StarRating value={d.stars} size={FontSize.Caption} />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

// ─── Individual Member View ───────────────────────────────────────────────────

function MemberView({ member }) {
  if (!member) return <EmptyState icon="👤" title="No data for this member" />
  const conf = member.confidence === 'High' ? Status.Success
    : member.confidence === 'Low' ? Status.Danger : Accent

  return (
    <div>
      <div style={{ background:Surface.Card, borderRadius:Radius['2xl'], padding:'16px 18px', marginBottom:Space.sm }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:Space.sm }}>
          <div>
            <p style={{ fontSize:FontSize.Caption, color:Text.Secondary, marginBottom:2 }}>
              {member.name}'s day
            </p>
            <p style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Bold, color:Text.Primary }}>
              {member.focus || 'Balanced day'}
            </p>
          </div>
          <ConfidenceBadge level={member.confidence} />
        </div>
        {member.summary && (
          <p style={{ fontSize:FontSize.BodySmall, color:Text.Secondary, lineHeight:1.5 }}>
            {member.summary}
          </p>
        )}
        {member.golden_window && (
          <div style={{ background:`${Accent}11`, borderRadius:Radius.lg, padding:'8px 12px', marginTop:Space.sm }}>
            <p style={{ fontSize:FontSize.Badge, color:Text.Secondary, marginBottom:2 }}>Best window</p>
            <p style={{ fontSize:FontSize.Body, fontWeight:FontWeight.Bold, color:Accent }}>{member.golden_window}</p>
          </div>
        )}
      </div>

      {/* Top recommendations for this member */}
      {member.recommendations?.top?.slice(0,3).map((r,i) => (
        <div key={i} style={{ background:Surface.Card, borderRadius:Radius.card, padding:Pad.card, marginBottom:Gap.card }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:Space.md }}>
            <span style={{ fontSize:FontSize.Heading2 }}>{r.icon}</span>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Bold, color:Text.Primary, marginBottom:Space.xs }}>
                {r.recommendation || r.action}
              </p>
              <p style={{ fontSize:FontSize.Caption, color:Text.Secondary }}>{r.reason || r.reasoning}</p>
              {r.bestTime && <p style={{ fontSize:FontSize.Caption, color:Accent, fontWeight:FontWeight.Bold, marginTop:Space.xs }}>⏰ {r.bestTime}</p>}
            </div>
          </div>
        </div>
      ))}

      {/* Timeline */}
      {member.timeline?.length > 0 && (<>
        <SectionTitle>Timeline</SectionTitle>
        <div style={{ position:'relative', paddingLeft:18 }}>
          <div style={{ position:'absolute', left:5, top:6, bottom:6, width:2, background:Surface.Line, borderRadius:2 }} />
          {member.timeline.slice(0,6).map((t,i) => (
            <div key={i} style={{ position:'relative', marginBottom:Space.md }}>
              <div style={{ position:'absolute', left:-13, top:5, width:8, height:8,
                borderRadius:'50%', background:Accent, border:'2px solid #000' }} />
              <p style={{ fontSize:FontSize.BodySmall, fontWeight:FontWeight.Bold, color:Accent }}>
                {t.time}{t.end?`–${t.end}`:''}
              </p>
              <p style={{ fontSize:FontSize.Caption, color:Text.Secondary }}>{t.label}</p>
            </div>
          ))}
        </div>
      </>)}
    </div>
  )
}

// ─── Member Switcher ──────────────────────────────────────────────────────────

function MemberSwitcher({ members, selected, onSelect }) {
  if (!members || members.length <= 1) return null
  return (
    <div style={{ display:'flex', gap:Space.xs, marginBottom:Space.xl, overflowX:'auto', paddingBottom:Space.xs }}>
      {members.map((m, i) => (
        <button key={i} onClick={() => onSelect(i)}
          style={{ flexShrink:0, background: selected===i ? Accent : Surface.Card,
            color: selected===i ? '#000' : Text.Secondary,
            border:'none', borderRadius:Radius.pill, padding:`7px 14px`,
            fontSize:FontSize.Caption, fontWeight:FontWeight.Bold,
            cursor:'pointer', fontFamily:'inherit', minHeight:32 }}>
          {m.name?.split(' ')[0] || `Member ${i+1}`}
        </button>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function FamilyScreen({ brief, daily, weeklyPlan, dateContext, onFetchFuture, onClose, inline=false }) {
  const [view,    setView]   = useState('overview')  // 'overview' | 'member'
  const [selIdx,  setSelIdx] = useState(0)
  const members = daily?.members || []

  return (
    <>
      {!inline && <div onClick={onClose} style={{ position:'fixed', inset:0, background:Surface.Overlay,
        backdropFilter:'blur(4px)', zIndex:Z.overlay }} />}
      <div className={inline ? '' : 'slide-up'} style={inline ? {} : {
        position:'fixed', left:0, right:0, bottom:0, maxWidth:448, margin:'0 auto',
        maxHeight:'92vh', overflowY:'auto', background:Surface.Base,
        borderRadius:Radius.modal, zIndex:Z.modal }}>
        <div style={inline ? {} : { padding:Pad.modal }}>
          {!inline && <div style={{ width:36, height:4, background:Surface.Line, borderRadius:Radius.sm,
            margin:`0 auto ${Space.xl}px` }} />}

          {/* Header */}
          <div style={{ marginBottom:Space.xl }}>
            <p style={{ fontSize:FontSize.Heading3, fontWeight:FontWeight.Bold, color:Text.Primary, marginBottom:Space.xs }}>
              Family
            </p>
            <p style={{ fontSize:FontSize.Caption, color:Text.Secondary }}>
              {dateContext?.weekday}, {dateContext?.dayMonth}
            </p>
          </div>

          {/* View toggle */}
          <div style={{ display:'flex', gap:Space.sm, marginBottom:Space.xl }}>
            {['overview','member'].map(v => (
              <TabButton key={v} label={v==='overview'?'Family Overview':'Individual'}
                active={view===v} onClick={()=>setView(v)} />
            ))}
          </div>

          {view === 'overview' && (
            <FamilyOverview brief={brief} daily={daily}
              dateContext={dateContext} onFetchFuture={onFetchFuture} />
          )}

          {view === 'member' && (<>
            {members.length > 1
              ? <>
                  <MemberSwitcher members={members} selected={selIdx} onSelect={setSelIdx} />
                  <MemberView member={members[selIdx]} />
                </>
              : <EmptyState icon="👨‍👩‍👧" title="Add family members"
                  body="Set up family members in Settings to see individual views." />
            }
          </>)}
        </div>
      </div>
    </>
  )
}
