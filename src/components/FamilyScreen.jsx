/**
 * FamilyScreen v30.0 — Family Intelligence Workspace.
 *
 * Question answered: "How does today look for our family?"
 * Warm, collaborative, human. Not technical. Not a planner duplicate.
 *
 * Sections:
 *   Today's Family Mood, Alignment, Recommended Together, Upcoming Shared Windows
 */

import { useState } from 'react'
import { SectionTitle, StarRating, ConfidenceBadge, StandardCard, EmptyState } from './common/index.jsx'
import { Surface, Text, Status, Accent, Radius, Space, Pad, Gap, FontSize, FontWeight, Z } from '../styles/tokens/index.js'

function FamilyHeader({ dateContext }) {
  return (
    <div style={{ marginBottom: Space.xl }}>
      <p style={{ fontSize: FontSize.Heading3, fontWeight: FontWeight.Bold,
        marginBottom: Space.xs, color: Text.Primary }}>
        Family
      </p>
      <p style={{ fontSize: FontSize.Caption, color: Text.Secondary }}>
        How does the family day look? · {dateContext?.weekday}, {dateContext?.dayMonth}
      </p>
    </div>
  )
}

function FamilyMoodCard({ familyAlignment, brief }) {
  const fb = brief?.familyBrief
  if (!familyAlignment && !fb) return (
    <EmptyState icon="👨‍👩‍👧"
      title="No family members added"
      body="Add family members in Settings to see family guidance." />
  )

  const energy     = fb?.energy || (familyAlignment?.stars >= 4 ? 'High' : 'Moderate')
  const bestWindow = fb?.bestWindow || familyAlignment?.best_shared_window || familyAlignment?.bestSharedWindow
  const moodColor  = energy === 'High' ? Status.Success : Accent
  const moodDesc   = energy === 'High'
    ? 'Everyone is aligned. A wonderful day for shared activities.'
    : 'Energy is steady. Light and flexible plans work best.'

  return (
    <div style={{ background: Surface.Card, borderRadius: Radius['2xl'], padding:'20px 18px', marginBottom: Space.sm }}>
      <p style={{ fontSize: FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
        color: Text.Secondary, fontWeight: FontWeight.Medium, marginBottom: Space.sm }}>
        Today's Family
      </p>
      <div style={{ display:'flex', alignItems:'center', gap: Space.md, marginBottom: Space.md }}>
        <span style={{ fontSize:32 }}>👨‍👩‍👧</span>
        <div>
          <p style={{ fontSize: FontSize.Heading3, fontWeight: FontWeight.Bold, color: moodColor }}>
            {energy === 'High' ? 'Strong Harmony' : 'Steady Energy'}
          </p>
          <p style={{ fontSize: FontSize.Caption, color: Text.Secondary }}>{moodDesc}</p>
        </div>
      </div>

      {bestWindow && (
        <div style={{ background:`${Accent}11`, borderRadius: Radius.lg, padding:'9px 12px', marginBottom: Space.sm }}>
          <p style={{ fontSize: FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
            color: Text.Secondary, fontWeight: FontWeight.Medium, marginBottom: Space.xs }}>
            Best Time Together
          </p>
          <p style={{ fontSize: FontSize.Heading2, fontWeight: FontWeight.Heavy, color: Accent }}>{bestWindow}</p>
        </div>
      )}

      {/* Recommended activities */}
      {(fb?.activities?.length > 0 || familyAlignment?.recommended?.length > 0) && (
        <div style={{ marginBottom: Space.sm }}>
          <p style={{ fontSize: FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
            color: Text.Secondary, fontWeight: FontWeight.Medium, marginBottom: Space.sm }}>
            Recommended Together
          </p>
          {(fb?.activities || familyAlignment?.recommended || []).slice(0, 3).map((a, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap: Space.sm,
              padding:'7px 0', borderBottom: i < 2 ? `1px solid ${Surface.Line}` : 'none' }}>
              <span style={{ fontSize:16 }}>✦</span>
              <p style={{ fontSize: FontSize.Body, color: Text.Primary }}>{a}</p>
            </div>
          ))}
        </div>
      )}

      {/* Cautions */}
      {(fb?.avoid?.length > 0 || familyAlignment?.avoid?.length > 0) && (
        <div style={{ background:'rgba(248,113,113,0.06)', borderRadius: Radius.lg, padding:'9px 12px' }}>
          <p style={{ fontSize: FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
            color: Status.Danger, fontWeight: FontWeight.Medium, marginBottom: Space.xs }}>
            Worth Noting
          </p>
          {(fb?.avoid || familyAlignment?.avoid || []).slice(0, 2).map((c, i) => (
            <p key={i} style={{ fontSize: FontSize.BodySmall, color: Text.Secondary, lineHeight:1.4,
              marginBottom: i < 1 ? Space.xs : 0 }}>{c}</p>
          ))}
        </div>
      )}
    </div>
  )
}

function MemberCard({ member, isFirst }) {
  const [open, setOpen] = useState(false)
  const emoji = isFirst ? '🙂' : ['👩','👦','👧','👴','👵'][Math.abs((member.name?.charCodeAt(0)||0) % 5)]

  return (
    <div style={{ background: Surface.Card, borderRadius: Radius.card, padding: Pad.card, marginBottom: Gap.card }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width:'100%', background:'none', border:'none', cursor:'pointer',
          textAlign:'left', fontFamily:'inherit', padding:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap: Space.md }}>
          <span style={{ fontSize:22 }}>{emoji}</span>
          <div style={{ flex:1 }}>
            <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold, color: Text.Primary, marginBottom:2 }}>
              {member.name}
            </p>
            {member.golden_window && (
              <p style={{ fontSize: FontSize.Caption, color: Accent, fontWeight: FontWeight.Bold }}>
                Best window: {member.golden_window}
              </p>
            )}
          </div>
          <span style={{ fontSize: FontSize.Caption, color: Text.Secondary }}>{open ? '▴' : '▾'}</span>
        </div>
      </button>
      {open && (
        <div className="fade-in" style={{ borderTop:`1px solid ${Surface.Line}`, marginTop: Space.md, paddingTop: Space.md }}>
          {member.summary && <p style={{ fontSize: FontSize.BodySmall, color: Text.Secondary, lineHeight:1.5, marginBottom: Space.sm }}>{member.summary}</p>}
          {member.focus   && <p style={{ fontSize: FontSize.BodySmall, color: Text.Primary }}>Focus: <strong>{member.focus}</strong></p>}
        </div>
      )}
    </div>
  )
}

function UpcomingSharedCard({ weeklyPlan, onFetchFuture }) {
  const shared = (weeklyPlan?.days || []).filter(d => d.daysAhead > 0 && d.stars >= 4).slice(0, 3)
  if (!shared.length) return null
  return (
    <div>
      <SectionTitle>Upcoming Good Family Windows</SectionTitle>
      {shared.map((d, i) => (
        <div key={i} onClick={() => onFetchFuture(d.daysAhead)}
          style={{ display:'flex', alignItems:'center', gap: Space.md, padding: Pad.card,
            background: Surface.Card, borderRadius: Radius.card, marginBottom: Gap.card, cursor:'pointer' }}>
          <div style={{ flexShrink:0, textAlign:'center', minWidth:48 }}>
            <p style={{ fontSize: FontSize.Caption, color: Accent, fontWeight: FontWeight.Bold,
              textTransform:'uppercase', letterSpacing:'0.06em' }}>
              {d.daysAhead === 1 ? 'Tmrw' : `+${d.daysAhead}d`}
            </p>
            <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Heavy, color: Text.Primary }}>
              {d.label?.split(' ')[0]}
            </p>
          </div>
          <div style={{ width:1, alignSelf:'stretch', background: Surface.Line }} />
          <div style={{ flex:1 }}>
            <p style={{ fontSize: FontSize.BodySmall, color: Text.Primary, marginBottom: Space.xs }}>{d.summary}</p>
            <StarRating value={d.stars} size={FontSize.Caption} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function FamilyScreen({ brief, daily, weeklyPlan, dateContext, onFetchFuture, onClose }) {
  const members = (daily?.members || [])
  const hasFamily = members.length > 1

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
          <FamilyHeader dateContext={dateContext} />
          <FamilyMoodCard familyAlignment={daily?.family_alignment} brief={brief} />
          {hasFamily && (
            <div style={{ marginBottom: Space.xl }}>
              <SectionTitle>Individual Outlook</SectionTitle>
              {members.map((m, i) => <MemberCard key={i} member={m} isFirst={i === 0} />)}
            </div>
          )}
          <UpcomingSharedCard weeklyPlan={weeklyPlan} onFetchFuture={onFetchFuture} />
        </div>
      </div>
    </>
  )
}
