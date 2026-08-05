/**
 * MorningBriefSection v29.3
 *
 * The daily briefing — one unified voice, not separate cards.
 * Reads like a morning executive summary.
 * Reading order: Greeting → Outlook → Theme → Focus → Best Time → Opportunity → Caution → Family
 */
import { useEffect, useState } from 'react'
import { minsUntilWindow } from '../../../lib/dataClient.js'
import { StarRating, ConfidenceBadge } from '../../common/index.jsx'
import { Surface, Text, Status, Outlook as OutlookC, Accent, Space, Radius, FontSize, FontWeight, Opacity } from '../../../styles/tokens/index.js'

// Derive a one-line outlook descriptor
function outlookLine(outlook, stars) {
  if (stars >= 5) return 'An excellent day ahead.'
  if (stars >= 4) return 'A strong day for meaningful work.'
  if (stars >= 3) return 'A balanced day — choose your moments.'
  if (stars >= 2) return 'A quieter day — conserve energy.'
  return 'A rest day — reflect rather than act.'
}

// Richer confidence wording
const CONF_WORD = { High: 'High confidence', Medium: 'Good confidence', Low: 'Lower confidence' }

export default function MorningBriefSection({ brief, primaryUser }) {
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name     = primaryUser?.name?.split(' ')[0] || null
  const [mins, setMins] = useState(() => minsUntilWindow(brief?.bestWindow))

  useEffect(() => {
    const t = setInterval(() => setMins(minsUntilWindow(brief?.bestWindow)), 60000)
    return () => clearInterval(t)
  }, [brief?.bestWindow])

  if (!brief) {
    return (
      <div style={{ background: Surface.Card, borderRadius: Radius['2xl'], padding: '20px 18px', marginBottom: Space.sm }}>
        <p style={{ fontSize: FontSize.Caption, color: Text.Secondary }}>Preparing your daily briefing…</p>
      </div>
    )
  }

  const outlookColor = OutlookC[brief.outlook] || Accent
  const topOpp       = brief.opportunities?.[0]
  const topCaution   = brief.cautions?.[0]
  const hasFamily    = !!brief.familyBrief

  return (
    <section aria-label="Today's Daily Brief" style={{ marginBottom: Space.sm }}>
      <div style={{ background: Surface.Card, borderRadius: Radius['2xl'], padding: '20px 18px' }}>

        {/* ── Line 1: Greeting ── */}
        <p style={{ fontSize: FontSize.BodySmall, color: Text.Secondary, marginBottom: 2 }}>
          {greeting}{name ? `, ${name}` : ''}
        </p>

        {/* ── Line 2: Outlook + Stars ── */}
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

        {/* ── Line 3: Summary sentence ── */}
        {brief.summary && (
          <p style={{ fontSize: FontSize.Body, color: Text.Primary, lineHeight: 1.55, marginBottom: Space.md,
            borderLeft: `2px solid ${outlookColor}`, paddingLeft: Space.md }}>
            {brief.summary}
          </p>
        )}

        {/* ── Row: Theme + Best Window (inline, not competing cards) ── */}
        <div style={{ display:'flex', alignItems:'stretch', gap: Space.sm, marginBottom: Space.md }}>
          <div style={{ flex:1, background:'rgba(255,255,255,0.04)', borderRadius: Radius.lg, padding:'10px 12px' }}>
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
              fontWeight: FontWeight.Medium, opacity: 0.6, marginBottom: Space.xs, color: '#000' }}>
              Best Window{mins != null && mins < 120 ? ` · in ${mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h`}` : ''}
            </p>
            <p style={{ fontSize: FontSize.Heading2, fontWeight: FontWeight.Heavy, letterSpacing:'-0.02em', color:'#000' }}>
              {brief.bestWindow || '—'}
            </p>
          </div>
        </div>

        {/* ── Opportunity + Caution: short inline signals ── */}
        {(topOpp || topCaution) && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: Space.sm,
            marginBottom: hasFamily ? Space.sm : 0 }}>
            {topOpp && (
              <div style={{ background:'rgba(74,222,128,0.07)', borderRadius: Radius.lg, padding:'9px 11px' }}>
                <p style={{ fontSize: FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
                  color: Status.Success, fontWeight: FontWeight.Medium, marginBottom: Space.xs }}>
                  Opportunity
                </p>
                <p style={{ fontSize: FontSize.BodySmall, color: Text.Primary, lineHeight:1.4 }}>
                  {topOpp.advice}
                </p>
              </div>
            )}
            {topCaution && (
              <div style={{ background:'rgba(248,113,113,0.07)', borderRadius: Radius.lg, padding:'9px 11px' }}>
                <p style={{ fontSize: FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
                  color: Status.Danger, fontWeight: FontWeight.Medium, marginBottom: Space.xs }}>
                  Avoid
                </p>
                <p style={{ fontSize: FontSize.BodySmall, color: Text.Primary, lineHeight:1.4 }}>
                  {topCaution.advice}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Family insight — only when relevant ── */}
        {hasFamily && (
          <div style={{ display:'flex', alignItems:'center', gap: Space.md, marginTop: Space.sm,
            padding:'9px 11px', background:'rgba(255,255,255,0.03)', borderRadius: Radius.lg }}>
            <span style={{ fontSize: FontSize.Heading2, flexShrink:0 }}>👨‍👩‍👧</span>
            <div>
              <p style={{ fontSize: FontSize.Label, textTransform:'uppercase', letterSpacing:'0.07em',
                color: Text.Secondary, fontWeight: FontWeight.Medium, marginBottom: 2 }}>
                Family Today
              </p>
              <p style={{ fontSize: FontSize.BodySmall, color: Text.Primary, lineHeight:1.4 }}>
                {brief.familyBrief.energy === 'High'
                  ? 'Excellent time together.'
                  : 'Keep plans light and easy.'}
                {brief.familyBrief.bestWindow ? ` Best shared window: ${brief.familyBrief.bestWindow}.` : ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
