/**
 * HomeScreen v29.3 — The Daily Briefing.
 *
 * One voice. One experience. Maximum value in minimum scroll.
 *
 * Priority order (cognitive load optimised):
 *   1. Morning Brief — everything you need about today, once
 *   2. Where to Focus — top 3 recommendations
 *   3. [Divider: Planning horizon begins]
 *   4. Coming Up — what deserves preparation
 *   5. This Week — best days at a glance
 *   6. [Divider: Day detail]
 *   7. Timeline — today's rhythm
 *   8. Family Today — if family configured
 *   9. Tomorrow — natural forward nudge
 *
 * Sections below the first divider recede visually — secondary info.
 */
import { useEffect, useState } from 'react'
import Logo from './Logo'
import { GhostButton, Divider, SkeletonHero, SkeletonCard } from './common/index.jsx'
import { Surface, Text, Radius, Space, FontSize, FontWeight } from '../styles/tokens/index.js'
import MorningBriefSection   from './pages/today/MorningBriefSection.jsx'
import RecommendationSection from './pages/today/RecommendationSection.jsx'
import UpcomingSection       from './pages/today/UpcomingSection.jsx'
import ThisWeekSection       from './pages/today/ThisWeekSection.jsx'
import TimelineSection       from './pages/today/TimelineSection.jsx'
import FamilyBriefSection    from './pages/today/FamilyBriefSection.jsx'
import TomorrowSection       from './pages/today/TomorrowSection.jsx'
import DiagnosticsPanel      from './pages/today/DiagnosticsPanel.jsx'

function Header({ primaryUser, onProfileOpen, onInvite }) {
  return (
    <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
      paddingTop:'calc(10px + env(safe-area-inset-top,0px))', paddingBottom: Space.md }}>
      <div style={{ display:'flex', alignItems:'center', gap: Space.sm }}>
        <Logo />
        <span style={{ fontSize: FontSize.Heading3, fontWeight: FontWeight.Bold,
          letterSpacing:'-0.01em', color: Text.Primary }}>Kairos</span>
      </div>
      <div style={{ display:'flex', gap: Space.sm }}>
        <GhostButton onClick={onInvite}>Share</GhostButton>
        <GhostButton onClick={onProfileOpen}>
          {primaryUser?.name ? `👤 ${primaryUser.name.split(' ')[0]}` : '+ Set up'}
        </GhostButton>
      </div>
    </header>
  )
}

function InstallBanner({ onDismiss }) {
  function install() {
    window.__installPrompt?.prompt()
    window.__installPrompt?.userChoice?.then(() => { window.__installPrompt = null; onDismiss() })
  }
  return (
    <div style={{ background: Surface.Card, borderRadius: Radius.card, padding:'11px 14px', marginBottom: Space.sm,
      display:'flex', alignItems:'center', gap: Space.md }}>
      <div style={{ flex:1 }}>
        <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold, marginBottom:2, color: Text.Primary }}>
          Add Kairos to your home screen
        </p>
        <p style={{ fontSize: FontSize.Caption, color: Text.Secondary }}>Your daily briefing in one tap</p>
      </div>
      <GhostButton onClick={install}>Install</GhostButton>
      <button onClick={onDismiss} aria-label="Dismiss" style={{ background:'none', border:'none',
        color: Text.Secondary, fontSize: FontSize.Heading2, cursor:'pointer', minHeight:32, padding:`0 ${Space.xs}px` }}>✕</button>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <>
      <SkeletonHero />
      <SkeletonCard lines={3} />
      <SkeletonCard lines={2} />
      <SkeletonCard lines={2} />
    </>
  )
}

export default function HomeScreen({
  brief, recommendationPackages, timeline, weeklyPlan, opportunities, diagnostics,
  daily, loading, primaryUser,
  onProfileOpen, onInvite, onFamilyPlan, onFetchFuture, onFeedback
}) {
  const [showInstall, setShowInstall] = useState(false)
  useEffect(() => {
    const h = () => setShowInstall(true)
    window.addEventListener('installable', h)
    return () => window.removeEventListener('installable', h)
  }, [])

  return (
    <main style={{ padding:`0 ${Space.xl}px`, overflowX:'hidden', paddingBottom: Space.sm }}>
      <Header primaryUser={primaryUser} onProfileOpen={onProfileOpen} onInvite={onInvite} />
      {showInstall && <InstallBanner onDismiss={() => setShowInstall(false)} />}
      {import.meta.env.DEV && <DiagnosticsPanel diagnostics={diagnostics} />}

      {loading ? <LoadingSkeleton /> : (
        <>
          {/* ── Primary: today's briefing ── */}
          <MorningBriefSection brief={brief} primaryUser={primaryUser} />
          <RecommendationSection packages={recommendationPackages} onFeedback={onFeedback} />

          {/* ── Planning horizon ── */}
          <Divider />
          <UpcomingSection opportunities={opportunities} weeklyPlan={weeklyPlan} onFetchFuture={onFetchFuture} />
          <ThisWeekSection weeklyPlan={weeklyPlan} onFetchFuture={onFetchFuture} />

          {/* ── Detail ── */}
          <Divider />
          <TimelineSection timeline={timeline} />
          <FamilyBriefSection brief={brief} daily={daily} onFamilyPlan={onFamilyPlan} />
          <TomorrowSection brief={brief} onFetchFuture={onFetchFuture} />

          <div style={{ textAlign:'center', padding:`${Space.xl}px 0 ${Space.sm}px`,
            borderTop:`1px solid ${Surface.Line}`, marginTop: Space.xl }}>
            <p style={{ fontSize: FontSize.Label, color: Surface.Line,
              letterSpacing:'0.07em', textTransform:'uppercase' }}>
              Kairos · Life Planning Companion
            </p>
          </div>
        </>
      )}
    </main>
  )
}
