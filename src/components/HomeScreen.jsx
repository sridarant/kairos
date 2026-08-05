/**
 * HomeScreen.jsx — Orchestration only. No business logic.
 * All sub-components imported from ./home/
 */
import { useEffect, useState, useMemo } from 'react'
import Logo from './Logo'
import MorningBrief    from './home/MorningBrief.jsx'
import TomorrowPreview from './home/TomorrowPreview.jsx'
import SignalCards     from './home/SignalCards.jsx'
import PersonalDashboard from './home/PersonalDashboard.jsx'
import FamilySection   from './home/FamilySection.jsx'
import TimelineSection from './home/TimelineSection.jsx'
import WeekSection     from './home/WeekSection.jsx'
import { computeInsight } from '../lib/dataClient'
import { buildMorningBrief } from '../../lib/dailyBrief/index.js'

const PLANET_SYMBOL = { Sun:'☀️', Moon:'🌙', Mars:'♂️', Mercury:'☿', Jupiter:'♃', Venus:'♀️', Saturn:'♄' }

function AstroBar({ daily }) {
  if (!daily) return null
  const tags = [
    daily.planet    && { emoji: PLANET_SYMBOL[daily.planet] || '✦', text: daily.planet },
    daily.nakshatra && { emoji:'✨', text: daily.nakshatra },
    daily.tithi     && { emoji:'🌗', text: `Tithi ${daily.tithi}` }
  ].filter(Boolean)
  if (!tags.length) return null
  return (
    <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
      {tags.map((t, i) => (
        <span key={i} style={{ background:'var(--gray-2)', border:'1px solid var(--gray-3)', borderRadius:20,
          padding:'3px 9px', fontSize:11, color:'#bbb', display:'inline-flex', alignItems:'center', gap:3 }}>
          {t.emoji} {t.text}
        </span>
      ))}
    </div>
  )
}

function PatternInsight({ userData }) {
  const insight = computeInsight(userData?.history || [])
  if (!insight) return null
  return (
    <div style={{ background:'var(--gray-2)', borderRadius:12, padding:'10px 14px', marginBottom:12, display:'flex', gap:10 }}>
      <span style={{ fontSize:14 }}>💡</span>
      <p style={{ fontSize:12, color:'var(--gray-4)', lineHeight:1.5 }}>{insight}</p>
    </div>
  )
}

function InstallBanner({ onDismiss }) {
  function handleInstall() {
    window.__installPrompt?.prompt()
    window.__installPrompt?.userChoice?.then(() => { window.__installPrompt = null; onDismiss() })
  }
  return (
    <div style={{ background:'var(--gray-2)', borderRadius:12, padding:'11px 14px', marginBottom:12, display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:13, fontWeight:600, marginBottom:1 }}>Add Kairos to Home Screen</p>
        <p style={{ fontSize:11, color:'var(--gray-4)' }}>Daily guidance in one tap</p>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        <button onClick={handleInstall} style={{ background:'var(--yellow)', border:'none', borderRadius:10,
          padding:'7px 12px', fontSize:12, fontWeight:700, color:'#000', cursor:'pointer', fontFamily:'inherit', minHeight:32 }}>Install</button>
        <button onClick={onDismiss} aria-label="Dismiss" style={{ background:'none', border:'none', color:'var(--gray-4)', fontSize:18, cursor:'pointer', padding:'0 4px', minHeight:32 }}>✕</button>
      </div>
    </div>
  )
}

export default function HomeScreen({ daily, loading, primaryUser, userData, onProfileOpen, onInsights, onFamilyPlan, onFetchFuture, onFeedback, recommendationPackages }) {
  const [version, setVersion]         = useState(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    fetch('/version.json').then(r => r.json()).then(v => setVersion(v.version)).catch(() => {})
    const h = () => setShowInstall(true)
    window.addEventListener('installable', h)
    return () => window.removeEventListener('installable', h)
  }, [])

  const brief = useMemo(() => {
    if (!daily) return null
    return buildMorningBrief(daily, daily.members?.[0] || null)
  }, [daily])

  const header = (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Logo /><span style={{ fontSize:17, fontWeight:700 }}>Kairos</span>
      </div>
      <button onClick={onProfileOpen} aria-label="Profile" style={{ background:'var(--gray-2)', border:'none', borderRadius:20,
        color:'var(--gray-4)', fontSize:12, padding:'6px 12px', cursor:'pointer', fontFamily:'inherit', minHeight:32 }}>
        {primaryUser?.name ? `👤 ${primaryUser.name.split(' ')[0]}` : '+ Me'}
      </button>
    </div>
  )

  if (loading) {
    return (
      <div style={{ padding:'16px 16px 0', paddingTop:'calc(16px + env(safe-area-inset-top,0px))' }}>
        {header}
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:260 }}>
          <span className="spinner" />
        </div>
      </div>
    )
  }

  const primaryMember = daily?.members?.[0] || null
  const familyMembers = (daily?.members || []).filter((_, i) => i > 0)

  return (
    <div style={{ padding:'16px 16px 0', paddingTop:'calc(16px + env(safe-area-inset-top,0px))' }}>
      {header}
      {showInstall && <InstallBanner onDismiss={() => setShowInstall(false)} />}

      {/* PRIMARY */}
      <MorningBrief brief={brief} onFetchFuture={onFetchFuture} />
      {brief?.tomorrowPreview && <TomorrowPreview preview={brief.tomorrowPreview} onFetchFuture={onFetchFuture} />}
      <AstroBar daily={daily} />
      <PatternInsight userData={userData} />
      <SignalCards daily={daily} />

      {/* SECONDARY */}
      <PersonalDashboard packages={recommendationPackages} onFeedback={onFeedback} />
      {familyMembers.length > 0 && (
        <FamilySection members={[primaryMember, ...familyMembers]} alignment={daily?.family_alignment} onFamilyPlan={onFamilyPlan} />
      )}
      <TimelineSection timeline={primaryMember?.timeline} />
      <WeekSection weekPlan={daily?.week_plan} onFetchFuture={onFetchFuture} />

      <div style={{ textAlign:'center', padding:'14px 0 8px', borderTop:'1px solid var(--gray-3)' }}>
        <button onClick={onInsights} style={{ background:'none', border:'none', color:'var(--gray-4)',
          fontSize:12, cursor:'pointer', fontFamily:'inherit', minHeight:32, padding:'4px 12px' }}>
          View Insights →
        </button>
        {version && <p style={{ fontSize:10, color:'var(--gray-3)', marginTop:4 }}>Kairos v{version}</p>}
      </div>
    </div>
  )
}
