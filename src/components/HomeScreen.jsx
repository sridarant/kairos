/**
 * HomeScreen v30.8 — Minimal, light-first Today screen.
 *
 * Answers five questions, in order:
 *   1. How is today?           → DaySummary
 *   2. What matters most?      → TopGuidance (one card, collapsed list below)
 *   3. When is the best window?→ DaySummary (best window chip)
 *   4. What should I watch?    → DaySummary (caution line)
 *   5. What else?              → expandable guidance list
 *
 * Elements removed vs previous version:
 *   - InstallBanner (moved to AppShell)
 *   - MorningBriefSection (merged into DaySummary)
 *   - Duplicate star ratings
 *   - Repeated time windows
 *   - Emoji-heavy headers
 *   - UpcomingSection (moved to Planner)
 *   - FamilyBriefSection (visible in Family tab; compact link here)
 *   - This-week section (moved to Planner)
 *   - TomorrowSection (in context panel only on desktop)
 */
import { useState, useEffect } from 'react'
import { Accent, Surface, Text, Suitability, Status, Outlook as OutlookC } from '../styles/tokens/index.js'
import { Space, FontSize, FontWeight, Radius, Pad } from '../styles/tokens/index.js'
import { PROFILE_STATUS_COLOR } from '../app/config/userProfile.js'
import { minsUntilWindow } from '../lib/utils.js'
import { SkeletonHero, SkeletonCard, EmptyState } from './common/index.jsx'
import RecommendationRow from './cards/RecommendationRow.jsx'

// ── Loading ───────────────────────────────────────────────────────────────────

function Loading() {
  return (
    <div style={{ padding:`${Space['3xl']}px ${Space.xl}px` }}>
      <SkeletonHero />
      <SkeletonCard lines={2} />
      <SkeletonCard lines={3} />
    </div>
  )
}

// ── Demo banner ───────────────────────────────────────────────────────────────

function SetupPrompt({ onSetup }) {
  return (
    <div style={{ padding:`${Space.md}px ${Space.xl}px`,
      borderBottom:`1px solid ${Surface.Line}`, display:'flex',
      alignItems:'center', justifyContent:'space-between' }}>
      <p style={{ fontSize:FontSize.Caption, color:Text.Secondary }}>
        Showing example guidance
      </p>
      <button onClick={onSetup}
        style={{ fontSize:FontSize.Caption, color:Accent, fontWeight:FontWeight.Bold,
          background:'none', border:'none', cursor:'pointer', padding:'4px 0' }}>
        Set up profile →
      </button>
    </div>
  )
}

// ── Tier display labels (R2.4: prefer words over numbers per spec) ─────────────
// Map engine tier keys → user-facing display labels
const TIER_DISPLAY = Object.freeze({
  Excellent:   'Exceptional',
  Good:        'Strong',
  Neutral:     'Moderate',
  Moderate:    'Challenging',
  Challenging: 'Caution',
})

// ── Day summary hero ──────────────────────────────────────────────────────────

function DaySummary({ brief, dateContext }) {
  const [mins, setMins] = useState(() => minsUntilWindow(brief?.bestWindow))
  useEffect(() => {
    const t = setInterval(() => setMins(minsUntilWindow(brief?.bestWindow)), 60_000)
    return () => clearInterval(t)
  }, [brief?.bestWindow])

  if (!brief) return null

  const tier     = brief.suitabilityTier || 'Neutral'
  const tierColor = Suitability[tier] || Text.Secondary
  // stars intentionally secondary per R2.4 spec — not displayed prominently

  return (
    <div style={{ padding:`${Space['3xl']}px ${Space.xl}px ${Space.xl}px` }}>
      {/* Date */}
      <p style={{ fontSize:FontSize.Caption, color:Text.Secondary, marginBottom:Space.xs }}>
        {dateContext?.fullDate || ''}
      </p>

      {/* Day rating — label-led per R2.4 spec. Stars are secondary. */}
      <div style={{ marginBottom:Space.xl }}>
        <p style={{ fontSize:FontSize.Heading2, fontWeight:FontWeight.Bold,
          color:tierColor, lineHeight:1.1, marginBottom:Space.xs }}>
          {TIER_DISPLAY[tier] || tier}
        </p>
        {brief.theme && (
          <p style={{ fontSize:FontSize.Body, color:Text.Secondary, marginBottom:0 }}>
            {brief.theme}
          </p>
        )}
      </div>

      {/* Best window + caution — two chips */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:Space.sm }}>
        {brief.bestWindow && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:Space.xs,
            background:Surface.Subtle, borderRadius:Radius.pill,
            padding:`6px ${Space.md}px` }}>
            <span style={{ fontSize:12, color:Accent }}>●</span>
            <span style={{ fontSize:FontSize.Caption, color:Text.Primary, fontWeight:FontWeight.Medium }}>
              {brief.bestWindow}
            </span>
            {mins != null && (
              <span style={{ fontSize:FontSize.Badge, color:Text.Secondary }}>
                in {mins}m
              </span>
            )}
          </div>
        )}
        {brief.avoidWindow && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:Space.xs,
            background:Surface.Subtle, borderRadius:Radius.pill,
            padding:`6px ${Space.md}px` }}>
            <span style={{ fontSize:12, color:Status.Danger }}>⚠</span>
            <span style={{ fontSize:FontSize.Caption, color:Text.Secondary }}>
              Avoid {brief.avoidWindow}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Top guidance ──────────────────────────────────────────────────────────────

function TopGuidance({ packages, onFeedback }) {
  const [expanded, setExpanded] = useState(false)
  if (!packages?.length) return null

  const top   = packages[0]                  // one primary recommendation
  const caution = packages.find(p => p.quality === 'caution' || p.stars <= 1)
  const rest  = packages.slice(1).filter(p => p !== caution)

  return (
    <div style={{ padding:`0 ${Space.xl}px` }}>
      {/* Divider label */}
      <p style={{ fontSize:FontSize.Label, textTransform:'uppercase', letterSpacing:'0.08em',
        color:Text.Muted, fontWeight:FontWeight.Medium, marginBottom:Space.md }}>
        What matters most
      </p>

      {/* Primary recommendation */}
      <RecommendationRow pkg={top} primary onFeedback={onFeedback} />

      {/* Caution — if different from top */}
      {caution && caution !== top && (
        <RecommendationRow pkg={caution} caution onFeedback={onFeedback} />
      )}

      {/* Expand button */}
      {rest.length > 0 && (
        <>
          {expanded && rest.map((p,i) => (
            <RecommendationRow key={p.id||i} pkg={p} onFeedback={onFeedback} />
          ))}
          <button onClick={() => setExpanded(v=>!v)}
            style={{ width:'100%', padding:`${Space.md}px 0`,
              background:'none', border:'none', cursor:'pointer',
              fontSize:FontSize.BodySmall, color:Text.Secondary,
              fontFamily:'inherit', textAlign:'left', marginTop:Space.sm }}>
            {expanded
              ? '↑ Show fewer'
              : `↓ ${rest.length} more guidance areas`}
          </button>
        </>
      )}
    </div>
  )
}

// ── Family cross-link ─────────────────────────────────────────────────────────

function FamilyLink({ brief, onFamilyPlan }) {
  const fa = brief?.familyBrief
  if (!fa?.bestWindow) return null
  return (
    <div style={{ padding:`${Space.xl}px`, borderTop:`1px solid ${Surface.Line}`,
      display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <div>
        <p style={{ fontSize:FontSize.Caption, color:Text.Muted, marginBottom:2 }}>Family</p>
        <p style={{ fontSize:FontSize.BodySmall, color:Text.Primary }}>
          Best together: <strong>{fa.bestWindow}</strong>
        </p>
      </div>
      <button onClick={onFamilyPlan}
        style={{ fontSize:FontSize.Caption, color:Accent, fontWeight:FontWeight.Bold,
          background:'none', border:'none', cursor:'pointer', padding:'4px 0' }}>
        View →
      </button>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function HomeScreen({
  brief, recommendationPackages, timeline, weeklyPlan, opportunities,
  daily, loading, status, primaryUser, profileStatus, dateContext,
  diagnostics, onProfileOpen, onInvite, onFamilyPlan,
  onFetchFuture, onReturnToday, onFeedback,
  showTimeline = true
}) {
  if (loading) return <Loading />
  if (!brief && !recommendationPackages?.length) return (
    <div style={{ padding:`${Space['3xl']}px ${Space.xl}px` }}>
      <EmptyState icon="☀" title="Preparing your day" body="Calculating your personalised guidance…" />
    </div>
  )

  const showSetup = profileStatus === 'demo' || profileStatus === 'incomplete'

  return (
    <div style={{ minHeight:'100%', background:Surface.Background }}>
      {showSetup && <SetupPrompt onSetup={onProfileOpen} />}

      <DaySummary brief={brief} dateContext={dateContext} />

      <TopGuidance packages={recommendationPackages} onFeedback={onFeedback} />

      <FamilyLink brief={brief} onFamilyPlan={onFamilyPlan} />
    </div>
  )
}
