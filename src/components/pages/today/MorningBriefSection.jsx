/**
 * MorningBriefSection v30.1
 *
 * One unified daily briefing. Reads like a morning executive summary.
 * Does NOT duplicate individual recommendation cards below it.
 * The brief summarises the DAY; cards expand individual recommendations.
 *
 * Brief contains: greeting → outlook → summary sentence → theme + window → family
 * It does NOT repeat the top recommendation (that's the card's job).
 */
import { useEffect, useState } from 'react'
import { minsUntilWindow } from '../../../lib/utils.js'
import { StarRating, ConfidenceBadge } from '../../common/index.jsx'
import {
  Surface, Text, Status, Outlook as OutlookC, Accent,
  Space, Radius, FontSize, FontWeight
} from '../../../styles/tokens/index.js'

const CONF_WORD = { High:'High confidence', Medium:'Good confidence', Low:'Lower confidence' }

export default function MorningBriefSection({ brief, primaryUser }) {
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name     = primaryUser?.name?.split(' ')[0] || null
  const [mins, setMins] = useState(() => minsUntilWindow(brief?.bestWindow))

  useEffect(() => {
    const t = setInterval(() => setMins(minsUntilWindow(brief?.bestWindow)), 60000)
    return () => clearInterval(t)
  }, [brief?.bestWindow])

  if (!brief) return (
    <div style={{ background: Surface.Card, borderRadius: Radius['2xl'],
      padding:'20px 18px', marginBottom: Space.sm }}>
      <p style={{ fontSize: FontSize.Caption, color: Text.Secondary }}>
        Preparing your daily briefing…
      </p>
    </div>
  )

  const outlookColor = OutlookC[brief.outlook] || Accent

  return (
    <section aria-label="Today's Daily Brief" style={{ marginBottom: Space.sm }}>
      <div style={{ background: Surface.Card, borderRadius: Radius['2xl'], padding:'20px 18px' }}>

        {/* Greeting */}
        <p style={{ fontSize: FontSize.BodySmall, color: Text.Secondary, marginBottom: 2 }}>
          {greeting}{name ? `, ${name}` : ''}
        </p>

        {/* Outlook + stars */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: Space.md }}>
          <div style={{ display:'flex', alignItems:'center', gap: Space.sm }}>
            <StarRating value={brief.stars} size={18} />
            <span style={{ fontSize: FontSize.Heading3, fontWeight: FontWeight.Bold, color: outlookColor }}>
              {brief.outlook} Day
            </span>
          </div>
          <span style={{ fontSize: FontSize.Caption, color: Text.Secondary }}>
            {CONF_WORD[brief.confidence] || 'Good confidence'}
          </span>
        </div>

        {/* Summary — day-level narrative, NOT a recommendation */}
        {brief.summary && (
          <p style={{ fontSize: FontSize.Body, color: Text.Primary, lineHeight:1.55,
            marginBottom: Space.md,
            borderLeft:`2px solid ${outlookColor}`, paddingLeft: Space.md }}>
            {brief.summary}
          </p>
        )}

        {/* Theme + best window */}
        <div style={{ display:'flex', alignItems:'stretch', gap: Space.sm, marginBottom: Space.sm }}>
          <div style={{ flex:1, background:Surface.Subtle, borderRadius: Radius.lg, padding:'10px 12px' }}>
            <p style={{ fontSize: FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
              color: Text.Secondary, fontWeight: FontWeight.Medium, marginBottom: Space.xs }}>
              Today's Focus
            </p>
            <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold, color: Text.Primary }}>
              {brief.theme}
            </p>
          </div>
          <div style={{ flex:1, background: Accent, borderRadius: Radius.lg, padding:'10px 12px' }}>
            <p style={{ fontSize: FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
              fontWeight: FontWeight.Medium, opacity:0.6, marginBottom: Space.xs, color: Text.Inverse }}>
              Best Window{mins != null && mins < 120
                ? ` · in ${mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h`}` : ''}
            </p>
            <p style={{ fontSize: FontSize.Heading2, fontWeight: FontWeight.Heavy,
              letterSpacing:'-0.02em', color: Text.Inverse }}>
              {brief.bestWindow || '—'}
            </p>
          </div>
        </div>

        {/* Avoid window — actionable caution at day level, not per-category */}
        {brief.avoidWindow && (
          <div style={{ background:`${Status.Danger}18`, borderRadius: Radius.lg,
            padding:'8px 12px', marginBottom: Space.sm,
            display:'flex', alignItems:'center', gap: Space.sm }}>
            <span style={{ fontSize: FontSize.Body, color: Status.Danger, flexShrink:0 }}>⚠</span>
            <p style={{ fontSize: FontSize.Caption, color: Text.Secondary, lineHeight:1.4 }}>
              <strong style={{ color: Status.Danger }}>Avoid:</strong>{' '}
              {brief.avoidWindow} — lower energy period
            </p>
          </div>
        )}

        {/* Family — only when relevant, one line */}
        {brief.familyBrief && (
          <div style={{ display:'flex', alignItems:'center', gap: Space.md, marginTop: Space.sm,
            padding:'9px 11px', background:Surface.Subtle, borderRadius: Radius.lg }}>
            <span style={{ fontSize: FontSize.Heading2, flexShrink:0 }}>👨‍👩‍👧</span>
            <p style={{ fontSize: FontSize.Caption, color: Text.Secondary, lineHeight:1.4 }}>
              {brief.familyBrief.energy === 'High'
                ? 'Excellent family harmony today.'
                : 'Moderate family energy — keep plans relaxed.'}
              {brief.familyBrief.bestWindow
                ? ` Best together: ${brief.familyBrief.bestWindow}.` : ''}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
