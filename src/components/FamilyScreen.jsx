/**
 * FamilyScreen v30.4.1
 *
 * ISSUE 3 FIX: Member switcher is visible at the very top, always.
 * ISSUE 2 FIX: Best shared window is derived from family member API data, not copied.
 *
 * Layout:
 *   [ Everyone ] [ Name1 ] [ Name2 ] [ Name3 ]  ← always visible
 *
 *   Everyone selected:
 *     → Family Day (combined outlook, best shared window, activities)
 *
 *   Member selected:
 *     → Individual Day (their name, rating, nakshatra, theme, window, recs, timeline)
 *
 * All data comes from daily.members (each calculated with their own birth details by /api/daily).
 * identity.family used only for relationship labels and notes (not for calculations).
 */
import { useState } from 'react'
import {
  SectionTitle, StarRating, ConfidenceBadge, StandardCard, EmptyState
} from './common/index.jsx'
import {
  Surface, Text, Status, Accent, Radius, Space, Pad, Gap, FontSize, FontWeight, Z
} from '../styles/tokens/index.js'

// ─── Member Switcher (always visible at top) ─────────────────────────────────

function MemberSwitcher({ members, selected, onSelect }) {
  // 'everyone' + all members who have a name
  const names = members.filter(m => m.name).map((m, i) => ({ i, name: m.name.split(' ')[0] }))

  return (
    <div style={{ display:'flex', gap: Space.xs, marginBottom: Space.xl,
      overflowX:'auto', paddingBottom: Space.xs, flexWrap:'nowrap' }}>
      <button onClick={() => onSelect('everyone')}
        aria-pressed={selected === 'everyone'}
        style={{ flexShrink:0,
          background: selected === 'everyone' ? Accent : Surface.Card,
          color:      selected === 'everyone' ? '#000' : Text.Secondary,
          border:'none', borderRadius: Radius.pill, padding:'8px 16px',
          fontSize: FontSize.Body, fontWeight: FontWeight.Bold,
          cursor:'pointer', fontFamily:'inherit', minHeight:36 }}>
        Everyone
      </button>
      {names.map(({ i, name }) => (
        <button key={i} onClick={() => onSelect(i)}
          aria-pressed={selected === i}
          style={{ flexShrink:0,
            background: selected === i ? Accent : Surface.Card,
            color:      selected === i ? '#000' : Text.Secondary,
            border:'none', borderRadius: Radius.pill, padding:'8px 16px',
            fontSize: FontSize.Body, fontWeight: FontWeight.Bold,
            cursor:'pointer', fontFamily:'inherit', minHeight:36 }}>
          {name}
        </button>
      ))}
    </div>
  )
}

// ─── Family Overview (Everyone selected) ─────────────────────────────────────

function FamilyOverview({ brief, daily, dateContext, onFetchFuture }) {
  const fa = daily?.family_alignment
  const fb = brief?.familyBrief

  // ISSUE 2 FIX: shared window from family_alignment (computed from member overlap in API)
  // NOT copied from primary user's golden window
  const bestShared = fa?.bestSharedWindow || fa?.best_shared_window || fb?.bestWindow

  const energy     = fb?.energy || (fa?.stars >= 4 ? 'High' : 'Moderate')
  const activities = (fa?.recommended || fb?.activities || []).slice(0, 3)
  const cautions   = fa?.avoid || fb?.avoid || []
  const moodColor  = energy === 'High' ? Status.Success : Accent

  const upcoming = (daily?.week_plan || []).filter(d => d.days_ahead > 0 && d.stars >= 4).slice(0, 3)

  return (
    <div>
      {/* Family mood card */}
      <div style={{ background: Surface.Card, borderRadius: Radius['2xl'], padding:'20px 18px', marginBottom: Space.sm }}>
        <p style={{ fontSize: FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
          color: Text.Secondary, fontWeight: FontWeight.Medium, marginBottom: Space.sm }}>
          Today's Family — {dateContext?.weekday || ''}, {dateContext?.dayMonth || ''}
        </p>

        <div style={{ display:'flex', alignItems:'center', gap: Space.md, marginBottom: Space.md }}>
          <span style={{ fontSize:32 }}>👨‍👩‍👧</span>
          <div>
            <p style={{ fontSize: FontSize.Heading3, fontWeight: FontWeight.Bold, color: moodColor }}>
              {energy === 'High' ? 'Strong Harmony' : 'Steady Energy'}
            </p>
            <p style={{ fontSize: FontSize.Caption, color: Text.Secondary }}>
              {energy === 'High'
                ? 'Everyone is aligned — a great day for shared activities.'
                : 'Energy is moderate — keep plans relaxed and flexible.'}
            </p>
          </div>
        </div>

        {/* Best shared window — from family alignment calculation */}
        {bestShared ? (
          <div style={{ background:`${Accent}11`, borderRadius: Radius.lg, padding:'9px 12px', marginBottom: Space.sm }}>
            <p style={{ fontSize: FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
              color: Text.Secondary, fontWeight: FontWeight.Medium, marginBottom: Space.xs }}>
              Best Time Together
            </p>
            <p style={{ fontSize: FontSize.Heading2, fontWeight: FontWeight.Heavy, color: Accent }}>
              {bestShared}
            </p>
            <p style={{ fontSize: FontSize.Badge, color: Text.Secondary, marginTop: Space.xs }}>
              Derived from individual members' favourable windows
            </p>
          </div>
        ) : null}

        {/* Family star rating */}
        {fa?.stars && (
          <div style={{ display:'flex', alignItems:'center', gap: Space.sm, marginBottom: Space.sm }}>
            <StarRating value={fa.stars} size={FontSize.Body} />
            <ConfidenceBadge level={fa.confidence} size={FontSize.Caption} />
          </div>
        )}

        {/* Recommended together */}
        {activities.length > 0 && (
          <div style={{ marginBottom: Space.sm }}>
            <p style={{ fontSize: FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
              color: Text.Secondary, fontWeight: FontWeight.Medium, marginBottom: Space.sm }}>
              Recommended Together
            </p>
            {activities.map((a, i) => (
              <div key={i} style={{ display:'flex', gap: Space.sm, padding:'7px 0',
                borderBottom: i < activities.length - 1 ? `1px solid ${Surface.Line}` : 'none' }}>
                <span>✦</span>
                <p style={{ fontSize: FontSize.Body, color: Text.Primary }}>{a}</p>
              </div>
            ))}
          </div>
        )}

        {/* Cautions */}
        {cautions.length > 0 && (
          <div style={{ background:'rgba(248,113,113,0.06)', borderRadius: Radius.lg, padding:'9px 12px' }}>
            <p style={{ fontSize: FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
              color: Status.Danger, fontWeight: FontWeight.Medium, marginBottom: Space.xs }}>
              Worth Noting
            </p>
            {cautions.slice(0, 2).map((c, i) => (
              <p key={i} style={{ fontSize: FontSize.BodySmall, color: Text.Secondary, lineHeight:1.4 }}>{c}</p>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming shared windows */}
      {upcoming.length > 0 && (
        <>
          <SectionTitle>Upcoming Good Family Windows</SectionTitle>
          {upcoming.map((d, i) => (
            <div key={i} onClick={() => onFetchFuture?.(d.days_ahead)}
              style={{ display:'flex', gap: Space.md, padding: Pad.card,
                background: Surface.Card, borderRadius: Radius.card, marginBottom: Gap.card, cursor:'pointer' }}>
              <div style={{ flexShrink:0, textAlign:'center', minWidth:48 }}>
                <p style={{ fontSize: FontSize.Caption, color: Accent, fontWeight: FontWeight.Bold,
                  textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  {d.days_ahead === 1 ? 'Tmrw' : `+${d.days_ahead}d`}
                </p>
                <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Heavy, color: Text.Primary }}>
                  {d.label?.split(' ')[0]}
                </p>
              </div>
              <div style={{ width:1, background: Surface.Line }} />
              <div style={{ flex:1 }}>
                <p style={{ fontSize: FontSize.BodySmall, color: Text.Primary, marginBottom: Space.xs }}>
                  {d.summary}
                </p>
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

function IndividualDay({ member, identityFamilyMember, dateContext }) {
  if (!member) return <EmptyState icon="👤" title="No data for this member" />

  const nameShort  = member.name?.split(' ')[0] || 'Member'
  const theme      = member.focus || 'Balanced day'
  const confColor  = member.confidence === 'High' ? Status.Success
    : member.confidence === 'Low' ? Status.Danger : Accent
  const relationship = identityFamilyMember?.relationship || ''

  // Top recommendations from this member's calculation
  const recs = [
    ...(member.recommendations?.top || []),
    ...(member.recommendations?.rest || [])
  ].slice(0, 4)

  // Timeline from this member's calculation
  const timeline = (member.timeline || []).slice(0, 6)

  return (
    <div>
      {/* Member header card */}
      <div style={{ background: Surface.Card, borderRadius: Radius['2xl'], padding:'20px 18px', marginBottom: Space.sm }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: Space.sm }}>
          <div>
            <p style={{ fontSize: FontSize.Caption, color: Text.Secondary, marginBottom: Space.xs }}>
              {relationship || 'Family member'} · {dateContext?.weekday}, {dateContext?.dayMonth}
            </p>
            <p style={{ fontSize: FontSize.Heading2, fontWeight: FontWeight.Heavy, color: Text.Primary }}>
              {nameShort}'s day
            </p>
          </div>
          <div style={{ textAlign:'right' }}>
            <StarRating value={member.stars} size={FontSize.Body} />
            <ConfidenceBadge level={member.confidence} size={FontSize.Caption} />
          </div>
        </div>

        {/* Today's theme */}
        <div style={{ background:'rgba(255,255,255,0.04)', borderRadius: Radius.lg,
          padding:'9px 12px', marginBottom: Space.sm }}>
          <p style={{ fontSize: FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
            color: Text.Secondary, fontWeight: FontWeight.Medium, marginBottom: Space.xs }}>
            Today's Theme
          </p>
          <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold, color: Text.Primary }}>{theme}</p>
        </div>

        {/* Panchang (from API member data) */}
        {member._panchang && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: Space.sm, marginBottom: Space.sm }}>
            {[
              { label:'Nakshatra', val: member._panchang?.nakshatra?.name },
              { label:'Tithi',     val: member._panchang?.tithi?.name },
              { label:'Vara',      val: member._panchang?.vara?.name || member._panchang?.vara }
            ].filter(i => i.val).map(({ label, val }) => (
              <div key={label} style={{ background:'rgba(255,255,255,0.03)', borderRadius: Radius.md, padding:'7px 8px' }}>
                <p style={{ fontSize: FontSize.Badge, color: Text.Secondary, marginBottom: Space.xs }}>{label}</p>
                <p style={{ fontSize: FontSize.Caption, color: Text.Primary, fontWeight: FontWeight.Bold }}>{val}</p>
              </div>
            ))}
          </div>
        )}

        {/* Best window */}
        {member.golden_window && (
          <div style={{ background:`${Accent}11`, borderRadius: Radius.lg, padding:'9px 12px', marginBottom: Space.sm }}>
            <p style={{ fontSize: FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
              color: Text.Secondary, fontWeight: FontWeight.Medium, marginBottom: Space.xs }}>
              Best Window
            </p>
            <p style={{ fontSize: FontSize.Heading2, fontWeight: FontWeight.Heavy, color: Accent }}>
              {member.golden_window}
            </p>
          </div>
        )}

        {/* Avoid */}
        {member.avoid_window && (
          <div style={{ background:'rgba(248,113,113,0.07)', borderRadius: Radius.lg, padding:'8px 12px' }}>
            <p style={{ fontSize: FontSize.Badge, color: Status.Danger, fontWeight: FontWeight.Bold }}>
              ⚠ Avoid: {member.avoid_window}
            </p>
          </div>
        )}
      </div>

      {/* Top priorities */}
      {recs.length > 0 && (
        <>
          <SectionTitle>{nameShort}'s Priorities</SectionTitle>
          {recs.map((r, i) => (
            <div key={i} style={{ background: Surface.Card, borderRadius: Radius.card,
              padding: Pad.card, marginBottom: Gap.card }}>
              <div style={{ display:'flex', gap: Space.md, alignItems:'flex-start' }}>
                <span style={{ fontSize: FontSize.Heading2, flexShrink:0 }}>{r.icon}</span>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold,
                    color: Text.Primary, marginBottom: Space.xs }}>
                    {r.recommendation || r.action || r.summary}
                  </p>
                  <p style={{ fontSize: FontSize.Caption, color: Text.Secondary }}>{r.reason || r.reasoning}</p>
                  {(r.bestWindow || r.bestTime) && (
                    <p style={{ fontSize: FontSize.Caption, color: Accent, fontWeight: FontWeight.Bold, marginTop: Space.xs }}>
                      ⏰ {r.bestWindow || r.bestTime}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Personal timeline */}
      {timeline.length > 0 && (
        <>
          <SectionTitle>Timeline</SectionTitle>
          <div style={{ position:'relative', paddingLeft:18 }}>
            <div style={{ position:'absolute', left:5, top:6, bottom:6,
              width:2, background: Surface.Line, borderRadius:2 }} />
            {timeline.map((t, i) => (
              <div key={i} style={{ position:'relative', marginBottom: Space.md }}>
                <div style={{ position:'absolute', left:-13, top:5, width:8, height:8,
                  borderRadius:'50%', background: Accent, border:'2px solid #000' }} />
                <p style={{ fontSize: FontSize.BodySmall, fontWeight: FontWeight.Bold, color: Accent }}>
                  {t.startTime || t.time}{t.endTime || t.end ? `–${t.endTime||t.end}` : ''}
                </p>
                <p style={{ fontSize: FontSize.Caption, color: Text.Secondary }}>{t.label || t.description}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function FamilyScreen({
  brief, daily, weeklyPlan, dateContext, identity, onFetchFuture, onClose, inline = false
}) {
  const [selected, setSelected] = useState('everyone')

  // All members from API (primary + family)
  const apiMembers = daily?.members || []
  const identityFamily = identity?.family || []

  const hasFamilyMembers = apiMembers.length > 1

  // When a member index is selected, find their API data and identity data
  const selectedMember = selected !== 'everyone' ? apiMembers[selected] : null
  const selectedIdentityMember = selected !== 'everyone' && selected > 0
    ? identityFamily[selected - 1]
    : null

  return (
    <>
      {!inline && (
        <div onClick={onClose} style={{ position:'fixed', inset:0, background: Surface.Overlay,
          backdropFilter:'blur(4px)', zIndex: Z.overlay }} />
      )}
      <div className={inline ? '' : 'slide-up'} style={inline ? {} : {
        position:'fixed', left:0, right:0, bottom:0, maxWidth:448, margin:'0 auto',
        maxHeight:'92vh', overflowY:'auto', background: Surface.Base,
        borderRadius: Radius.modal, zIndex: Z.modal }}>
        <div style={inline ? {} : { padding: Pad.modal }}>
          {!inline && (
            <div style={{ width:36, height:4, background: Surface.Line, borderRadius: Radius.sm,
              margin:`0 auto ${Space.xl}px` }} />
          )}

          {/* Header */}
          <div style={{ marginBottom: Space.sm }}>
            <p style={{ fontSize: FontSize.Heading3, fontWeight: FontWeight.Bold,
              color: Text.Primary, marginBottom: Space.xs }}>
              Family
            </p>
          </div>

          {/* ── MEMBER SWITCHER — always visible at top ── */}
          {hasFamilyMembers ? (
            <MemberSwitcher
              members={apiMembers}
              selected={selected}
              onSelect={setSelected} />
          ) : (
            <div style={{ background: Surface.Card, borderRadius: Radius.lg,
              padding: Pad.cardSm, marginBottom: Space.xl }}>
              <p style={{ fontSize: FontSize.Caption, color: Text.Secondary }}>
                Add family members in Settings to see individual views and shared windows.
              </p>
            </div>
          )}

          {/* ── CONTENT: overview or individual ── */}
          {selected === 'everyone' ? (
            <FamilyOverview
              brief={brief}
              daily={daily}
              dateContext={dateContext}
              onFetchFuture={onFetchFuture} />
          ) : (
            <IndividualDay
              member={selectedMember}
              identityFamilyMember={selectedIdentityMember}
              dateContext={dateContext} />
          )}
        </div>
      </div>
    </>
  )
}
