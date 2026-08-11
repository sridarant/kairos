/**
 * FamilyScreen v30.6 — Family workspace. Always a primary page. Never a modal.
 *
 * Layout:
 *   Header: "Family · Saturday, August 8"
 *   Member switcher: [ Everyone ] [ Name1 ] [ Name2 ] ...
 *   Content: Overview (everyone) or Individual (member selected)
 *
 * Member switcher driven by daily.members (independently calculated per birth details).
 * Identity.family used only for relationship labels.
 */
import { useState, useMemo } from 'react'
import {
  SectionTitle, StarRating, ConfidenceBadge, EmptyState, GhostButton
} from './common/index.jsx'
import {
  Surface, Text, Status, Accent, Radius, Space, Pad, Gap, FontSize, FontWeight
} from '../styles/tokens/index.js'

// ─── Member Switcher ──────────────────────────────────────────────────────────

function MemberSwitcher({ members, selected, onSelect }) {
  const named = members.filter(m => m.name)
  if (!named.length) return null
  return (
    <div style={{
      display:'flex', gap:Space.xs, overflowX:'auto', paddingBottom:Space.xs,
      marginBottom:Space.xl, flexWrap:'nowrap'
    }}>
      {[{ id:'everyone', label:'Everyone' }, ...named.map((m,i) => ({
        id:i, label: m.name.split(' ')[0]
      }))].map(item => (
        <button key={item.id} onClick={() => onSelect(item.id)}
          aria-pressed={selected === item.id}
          style={{
            flexShrink:0,
            background: selected === item.id ? Accent : Surface.Card,
            color:      selected === item.id ? Text.Inverse : Text.Secondary,
            border:'none', borderRadius:Radius.pill,
            padding:`${Space.sm}px ${Space.xl}px`,
            fontSize:FontSize.Body, fontWeight:FontWeight.Bold,
            cursor:'pointer', fontFamily:'inherit', minHeight:38
          }}>
          {item.label}
        </button>
      ))}
    </div>
  )
}

// ─── Member compact cards (Everyone view) ─────────────────────────────────────

function MemberCompactCard({ member, idx, onSelect }) {
  const win = member.goldenWindow
  return (
    <div onClick={() => onSelect(idx)} style={{
      background:Surface.Card, borderRadius:Radius.card, padding:Pad.card,
      cursor:'pointer', flex:'1 1 0', minWidth:120
    }}>
      <p style={{ fontSize:FontSize.BodySmall, fontWeight:FontWeight.Bold, color:Text.Primary, marginBottom:Space.xs }}>
        {member.name?.split(' ')[0]}
      </p>
      <StarRating value={member.stars} size={FontSize.Caption} />
      {win && (
        <p style={{ fontSize:FontSize.Badge, color:Accent, fontWeight:FontWeight.Bold, marginTop:Space.xs }}>
          {win}
        </p>
      )}
    </div>
  )
}

// ─── Family Overview (Everyone selected) ─────────────────────────────────────

function FamilyOverview({ brief, daily, dateContext, onMemberSelect, onFetchFuture }) {
  const fa  = daily?.family_alignment
  const fb  = brief?.familyBrief
  const members = (daily?.members || []).filter(m => m.name)

  const bestShared  = fa?.bestSharedWindow || fa?.best_shared_window || fb?.bestWindow
  const energy      = fb?.energy || (fa?.stars >= 4 ? 'High' : 'Moderate')
  const activities  = (fa?.recommended || fb?.activities || []).slice(0, 3)
  const cautions    = fa?.avoid || fb?.avoid || []
  const moodColor   = energy === 'High' ? Status.Success : Accent
  // week_plan uses snake_case from raw API; days_ahead is normalised here
  const upcoming    = (daily?.week_plan || []).filter(d => (d.days_ahead||d.daysAhead) > 0 && d.stars >= 4).slice(0, 3)

  return (
    <div>
      {/* Family mood */}
      <div style={{ background:Surface.Card, borderRadius:Radius['2xl'], padding:'20px 18px', marginBottom:Space.sm }}>
        <div style={{ display:'flex', alignItems:'center', gap:Space.md, marginBottom:Space.md }}>
          <span style={{ fontSize:32 }}>👨‍👩‍👧</span>
          <div>
            <p style={{ fontSize:FontSize.Heading3, fontWeight:FontWeight.Bold, color:moodColor }}>
              {energy === 'High' ? 'Strong Harmony' : 'Steady Energy'}
            </p>
            <p style={{ fontSize:FontSize.Caption, color:Text.Secondary }}>
              {energy === 'High' ? 'Everyone is aligned — great for shared activities.' : 'Keep plans relaxed and flexible.'}
            </p>
          </div>
        </div>

        {fa?.stars && (
          <div style={{ display:'flex', alignItems:'center', gap:Space.sm, marginBottom:Space.md }}>
            <StarRating value={fa.stars} size={FontSize.Body} />
            <ConfidenceBadge level={fa.confidence} size={FontSize.Caption} />
          </div>
        )}

        {bestShared && (
          <div style={{ background:`${Accent}11`, borderRadius:Radius.lg, padding:'9px 12px', marginBottom:Space.sm }}>
            <p style={{ fontSize:FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
              color:Text.Secondary, fontWeight:FontWeight.Medium, marginBottom:Space.xs }}>
              Best Time Together
            </p>
            <p style={{ fontSize:FontSize.Heading2, fontWeight:FontWeight.Heavy, color:Accent }}>{bestShared}</p>
            <p style={{ fontSize:FontSize.Badge, color:Text.Secondary, marginTop:Space.xs }}>
              Derived from individual members' windows
            </p>
          </div>
        )}

        {activities.length > 0 && (
          <div style={{ marginBottom:cautions.length ? Space.sm : 0 }}>
            <p style={{ fontSize:FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
              color:Text.Secondary, fontWeight:FontWeight.Medium, marginBottom:Space.sm }}>
              Recommended Together
            </p>
            {activities.map((a,i) => (
              <div key={i} style={{ display:'flex', gap:Space.sm, padding:'6px 0',
                borderBottom: i < activities.length-1 ? `1px solid ${Surface.Line}` : 'none' }}>
                <span>✦</span>
                <p style={{ fontSize:FontSize.Body, color:Text.Primary }}>{a}</p>
              </div>
            ))}
          </div>
        )}

        {cautions.length > 0 && (
          <div style={{ background:`${Status.Danger}18`, borderRadius:Radius.lg, padding:'9px 12px', marginTop:Space.sm }}>
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

      {/* Individual compact cards */}
      {members.length > 1 && (
        <>
          <SectionTitle>Individual Outlook</SectionTitle>
          <div style={{ display:'flex', gap:Space.sm, flexWrap:'wrap', marginBottom:Space.xl }}>
            {members.map((m, i) => (
              <MemberCompactCard key={i} member={m} idx={i} onSelect={onMemberSelect} />
            ))}
          </div>
        </>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <>
          <SectionTitle>Upcoming Good Windows</SectionTitle>
          {upcoming.map((d,i) => (
            <div key={i} onClick={() => onFetchFuture?.(d.days_ahead||d.daysAhead)}
              style={{ display:'flex', gap:Space.md, padding:Pad.card,
                background:Surface.Card, borderRadius:Radius.card, marginBottom:Gap.card, cursor:'pointer' }}>
              <div style={{ flexShrink:0, minWidth:52, textAlign:'center' }}>
                <p style={{ fontSize:FontSize.Caption, color:Accent, fontWeight:FontWeight.Bold,
                  textTransform:'uppercase', letterSpacing:'0.05em' }}>
                  {(d.days_ahead||d.daysAhead)===1?'Tmrw':`+${d.days_ahead||d.daysAhead}d`}
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

// ─── Individual member view ───────────────────────────────────────────────────

function IndividualDay({ member, identityMember, dateContext }) {
  if (!member) return <EmptyState icon="👤" title="No data for this member" />

  const firstName  = member.name?.split(' ')[0] || 'Member'
  const relationship = identityMember?.relationship || ''
  const recs = [...(member.recommendations?.top||[]), ...(member.recommendations?.rest||[])].slice(0,4)
  const timeline = (member.timeline||[]).slice(0,8)

  return (
    <div>
      {/* Member header */}
      <div style={{ background:Surface.Card, borderRadius:Radius['2xl'], padding:'20px 18px', marginBottom:Space.sm }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:Space.sm }}>
          <div>
            {relationship && (
              <p style={{ fontSize:FontSize.Caption, color:Text.Secondary, marginBottom:Space.xs }}>{relationship}</p>
            )}
            <p style={{ fontSize:FontSize.Heading2, fontWeight:FontWeight.Heavy, color:Text.Primary }}>
              {firstName}'s day
            </p>
          </div>
          <div style={{ textAlign:'right' }}>
            <StarRating value={member.stars} size={FontSize.Body} />
            <ConfidenceBadge level={member.confidence} size={FontSize.Caption} />
          </div>
        </div>

        {member.focus && (
          <div style={{ background:Surface.Subtle, borderRadius:Radius.lg, padding:'8px 12px', marginBottom:Space.sm }}>
            <p style={{ fontSize:FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
              color:Text.Secondary, fontWeight:FontWeight.Medium, marginBottom:Space.xs }}>Today's Focus</p>
            <p style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Bold, color:Text.Primary }}>{member.focus}</p>
          </div>
        )}

        {member.goldenWindow && (
          <div style={{ background:`${Accent}11`, borderRadius:Radius.lg, padding:'9px 12px', marginBottom:Space.sm }}>
            <p style={{ fontSize:FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
              color:Text.Secondary, fontWeight:FontWeight.Medium, marginBottom:Space.xs }}>Best Window</p>
            <p style={{ fontSize:FontSize.Heading2, fontWeight:FontWeight.Heavy, color:Accent }}>{member.goldenWindow}</p>
          </div>
        )}

        {member.avoidWindow && (
          <div style={{ background:`${Status.Danger}18`, borderRadius:Radius.lg, padding:'8px 12px' }}>
            <p style={{ fontSize:FontSize.Badge, color:Status.Danger, fontWeight:FontWeight.Bold }}>
              ⚠ Avoid: {member.avoidWindow}
            </p>
          </div>
        )}
      </div>

      {/* Panchang */}
      {member._panchang && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:Space.sm, marginBottom:Space.sm }}>
          {[
            { label:'Nakshatra', val:member._panchang?.nakshatra?.name },
            { label:'Tithi',     val:member._panchang?.tithi?.name },
            { label:'Vara',      val:member._panchang?.vara?.name || member._panchang?.vara }
          ].filter(i=>i.val).map(({label,val}) => (
            <div key={label} style={{ background:Surface.Card, borderRadius:Radius.md, padding:'7px 8px' }}>
              <p style={{ fontSize:FontSize.Badge, color:Text.Secondary, marginBottom:2 }}>{label}</p>
              <p style={{ fontSize:FontSize.Caption, color:Text.Primary, fontWeight:FontWeight.Bold }}>{val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Priorities */}
      {recs.length > 0 && (
        <>
          <SectionTitle>{firstName}'s Priorities</SectionTitle>
          {recs.map((r,i) => (
            <div key={i} style={{ background:Surface.Card, borderRadius:Radius.card,
              padding:Pad.card, marginBottom:Gap.card }}>
              <div style={{ display:'flex', gap:Space.md }}>
                <span style={{ fontSize:FontSize.Heading2, flexShrink:0 }}>{r.icon}</span>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Bold,
                    color:Text.Primary, marginBottom:Space.xs }}>
                    {r.recommendation||r.action||r.summary}
                  </p>
                  <p style={{ fontSize:FontSize.Caption, color:Text.Secondary }}>{r.reason||r.reasoning}</p>
                  {(r.bestWindow||r.bestTime) && (
                    <p style={{ fontSize:FontSize.Caption, color:Accent, fontWeight:FontWeight.Bold, marginTop:Space.xs }}>
                      ⏰ {r.bestWindow||r.bestTime}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Timeline */}
      {timeline.length > 0 && (
        <>
          <SectionTitle>{firstName}'s Timeline</SectionTitle>
          <div style={{ position:'relative', paddingLeft:18 }}>
            <div style={{ position:'absolute', left:5, top:6, bottom:6, width:2,
              background:Surface.Line, borderRadius:2 }} />
            {timeline.map((t,i) => (
              <div key={i} style={{ position:'relative', marginBottom:Space.md }}>
                <div style={{ position:'absolute', left:-13, top:5, width:8, height:8,
                  borderRadius:'50%', background:Accent, border:'2px solid #000' }} />
                <p style={{ fontSize:FontSize.BodySmall, fontWeight:FontWeight.Bold, color:Accent }}>
                  {t.startTime||t.time}{(t.endTime||t.end)?`–${t.endTime||t.end}`:''}
                </p>
                <p style={{ fontSize:FontSize.Caption, color:Text.Secondary }}>{t.label||t.description}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function FamilyScreen({
  brief, daily, members, weeklyPlan, dateContext, identity, onFetchFuture
}) {
  const [selected, setSelected] = useState('everyone')

  const apiMembers    = members || []
  const identityFamily = identity?.family || []
  const hasFamilyMembers = apiMembers.length > 1

  // When member index selected, find their API data and identity data
  const selectedMember         = selected !== 'everyone' ? apiMembers[selected] : null
  const selectedIdentityMember = selected !== 'everyone' && selected > 0
    ? identityFamily[selected - 1] : null

  function handleMemberSelect(idx) { setSelected(idx) }

  return (
    <div style={{ padding:`${Space['3xl']}px ${Space.xl}px` }}>
      {/* Header */}
      <div style={{ marginBottom:Space.sm }}>
        <p style={{ fontSize:FontSize.Heading2, fontWeight:FontWeight.Heavy, color:Text.Primary, marginBottom:Space.xs }}>
          Family
        </p>
        {dateContext && (
          <p style={{ fontSize:FontSize.Caption, color:Text.Secondary }}>
            {dateContext.weekday}, {dateContext.dayMonth}
          </p>
        )}
      </div>

      {/* Member switcher — always visible */}
      {hasFamilyMembers ? (
        <MemberSwitcher
          members={apiMembers}
          selected={selected}
          onSelect={setSelected} />
      ) : (
        <div style={{ background:Surface.Card, borderRadius:Radius.lg, padding:Pad.cardSm, marginBottom:Space.xl }}>
          <p style={{ fontSize:FontSize.Caption, color:Text.Secondary }}>
            Add family members in Settings to see individual views and shared windows.
          </p>
        </div>
      )}

      {/* Content: everyone or individual */}
      {selected === 'everyone' ? (
        <FamilyOverview
          brief={brief} daily={daily}
          dateContext={dateContext}
          onMemberSelect={handleMemberSelect}
          onFetchFuture={onFetchFuture} />
      ) : (
        <IndividualDay
          member={selectedMember}
          identityMember={selectedIdentityMember}
          dateContext={dateContext} />
      )}
    </div>
  )
}
