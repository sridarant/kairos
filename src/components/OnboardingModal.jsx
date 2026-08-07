/**
 * OnboardingModal — First-run experience.
 * Step 1: Name. Step 2: Birth details. Step 3: Family (optional).
 * On complete: calls onComplete(profileFields, familyArray).
 * IdentityManager.saveProfile() is called by the hook, not here.
 */
import { useState } from 'react'
import {
  PrimaryButton, SecondaryButton, FieldLabel, Caption
} from './common/index.jsx'
import {
  Surface, Text, Status, Accent, Radius, Space, Pad, FontSize, FontWeight, Z
} from '../styles/tokens/index.js'

const STEPS = ['about', 'birth', 'family']

function ProgressBar({ step }) {
  const i = STEPS.indexOf(step)
  return (
    <div style={{ display:'flex', gap:Space.sm, marginBottom:Space['3xl'] }}>
      {STEPS.map((_, idx) => (
        <div key={idx} style={{ flex:1, height:3, borderRadius:2,
          background: idx <= i ? Accent : Surface.Line }} />
      ))}
    </div>
  )
}

function inp() {
  return {
    width:'100%', background:Surface.Card, border:`1px solid ${Surface.Line}`,
    borderRadius:Radius.input, padding:Pad.input, fontSize:FontSize.Body,
    color:Text.Primary, fontFamily:'inherit', outline:'none', boxSizing:'border-box'
  }
}

function formatDob(raw) {
  const d = raw.replace(/\D/g,'').slice(0,8)
  if (d.length<=2) return d
  if (d.length<=4) return `${d.slice(0,2)}-${d.slice(2)}`
  return `${d.slice(0,2)}-${d.slice(2,4)}-${d.slice(4)}`
}

function StepAbout({ name, setName, onNext, onSkip }) {
  return (
    <div>
      <p style={{ fontSize:FontSize.Heading2, fontWeight:FontWeight.Bold, color:Text.Primary, marginBottom:Space.sm }}>
        Welcome to Kairos
      </p>
      <p style={{ fontSize:FontSize.Body, color:Text.Secondary, lineHeight:1.6, marginBottom:Space['3xl'] }}>
        Kairos gives you daily life planning guidance using Vedic astrology.
        Let's start with your name.
      </p>
      <FieldLabel text="Your name" />
      <input placeholder="e.g. Priya" value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key==='Enter' && name.trim() && onNext()}
        style={{ ...inp(), marginBottom:Space['3xl'] }} autoFocus />
      <PrimaryButton onClick={onNext} disabled={!name.trim()} fullWidth>Continue →</PrimaryButton>
      <div style={{ textAlign:'center', marginTop:Space.md }}>
        <button onClick={onSkip} style={{ background:'none', border:'none', color:Text.Secondary,
          fontSize:FontSize.Caption, cursor:'pointer', fontFamily:'inherit' }}>
          Continue in demo mode
        </button>
      </div>
    </div>
  )
}

function StepBirth({ dob, setDob, birthTime, setBirthTime, onNext, onSkip }) {
  return (
    <div>
      <p style={{ fontSize:FontSize.Heading2, fontWeight:FontWeight.Bold, color:Text.Primary, marginBottom:Space.sm }}>
        Birth details
      </p>
      <p style={{ fontSize:FontSize.Body, color:Text.Secondary, lineHeight:1.6, marginBottom:Space['3xl'] }}>
        Your birth date and time allow Kairos to calculate planetary positions.
        Your data stays on this device only.
      </p>
      <div style={{ marginBottom:Space.xl }}>
        <FieldLabel text="Date of birth" />
        <input placeholder="DD-MM-YYYY" value={dob}
          onChange={e => setDob(formatDob(e.target.value))} style={inp()} />
        <p style={{ fontSize:FontSize.Badge, color:Text.Secondary, marginTop:Space.xs }}>
          Day-month-year, e.g. 20-10-1976
        </p>
      </div>
      <div style={{ marginBottom:Space['3xl'] }}>
        <FieldLabel text="Birth time (recommended)" />
        <input placeholder="HH:MM" value={birthTime}
          onChange={e => setBirthTime(e.target.value)} style={inp()} />
        <p style={{ fontSize:FontSize.Badge, color:Text.Secondary, marginTop:Space.xs }}>
          More accurate time → more accurate timing guidance
        </p>
      </div>
      <PrimaryButton onClick={onNext} disabled={dob.length < 8} fullWidth>Continue →</PrimaryButton>
      <div style={{ textAlign:'center', marginTop:Space.md }}>
        <button onClick={onSkip} style={{ background:'none', border:'none', color:Text.Secondary,
          fontSize:FontSize.Caption, cursor:'pointer', fontFamily:'inherit' }}>
          Skip birth details for now
        </button>
      </div>
    </div>
  )
}

function StepFamily({ family, setFamily, onComplete }) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft]   = useState({ name:'', dob:'', birth_time:'' })

  function addMember() {
    if (!draft.name.trim()) return
    setFamily(prev => [...prev, { ...draft }])
    setDraft({ name:'', dob:'', birth_time:'' })
    setAdding(false)
  }

  return (
    <div>
      <p style={{ fontSize:FontSize.Heading2, fontWeight:FontWeight.Bold, color:Text.Primary, marginBottom:Space.sm }}>
        Your family
      </p>
      <p style={{ fontSize:FontSize.Body, color:Text.Secondary, lineHeight:1.6, marginBottom:Space['3xl'] }}>
        Kairos can show guidance for your whole family and suggest shared windows.
        Optional — add family members later in Settings.
      </p>

      {family.map((m, i) => (
        <div key={i} style={{ background:Surface.Card, borderRadius:Radius.card, padding:Pad.cardSm,
          marginBottom:Space.sm, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:FontSize.Body, color:Text.Primary }}>{m.name}</span>
          <button onClick={() => setFamily(f => f.filter((_,j)=>j!==i))} style={{
            background:'none', border:'none', color:Status.Danger, cursor:'pointer',
            fontSize:FontSize.Body, fontFamily:'inherit' }}>✕</button>
        </div>
      ))}

      {adding ? (
        <div style={{ background:Surface.Card, borderRadius:Radius.card, padding:Pad.card, marginBottom:Space.xl }}>
          <div style={{ marginBottom:Space.md }}>
            <FieldLabel text="Name" />
            <input value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))}
              placeholder="Name" style={inp()} />
          </div>
          <div style={{ marginBottom:Space.md }}>
            <FieldLabel text="Date of birth (optional)" />
            <input value={draft.dob} onChange={e=>setDraft(d=>({...d,dob:formatDob(e.target.value)}))}
              placeholder="DD-MM-YYYY" style={inp()} />
          </div>
          <div style={{ display:'flex', gap:Space.sm }}>
            <SecondaryButton onClick={() => setAdding(false)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={addMember} disabled={!draft.name.trim()}>Add</PrimaryButton>
          </div>
        </div>
      ) : family.length < 3 && (
        <button onClick={() => setAdding(true)} style={{ width:'100%', background:Surface.Card,
          border:`1px dashed ${Surface.Line}`, borderRadius:Radius.card, padding:Pad.cardSm,
          color:Text.Secondary, fontSize:FontSize.Body, cursor:'pointer', fontFamily:'inherit',
          marginBottom:Space.xl }}>
          + Add family member
        </button>
      )}

      {!adding && (
        <PrimaryButton onClick={onComplete} fullWidth>
          {family.length > 0 ? 'Set up Kairos →' : 'Start without family →'}
        </PrimaryButton>
      )}
    </div>
  )
}

export default function OnboardingModal({ onComplete, onSkip }) {
  const [step,      setStep]      = useState('about')
  const [name,      setName]      = useState('')
  const [dob,       setDob]       = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [family,    setFamily]    = useState([])

  function handleComplete() {
    onComplete(
      { name: name.trim(), dob: dob.trim(), birth_time: birthTime.trim() },
      family
    )
  }

  return (
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)',
        backdropFilter:'blur(6px)', zIndex:Z.overlay }} />
      <div className="slide-up" style={{
        position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
        zIndex:Z.modal, padding:Space.xl }}>
        <div style={{ width:'100%', maxWidth:480, background:Surface.Base,
          borderRadius:Radius['2xl'], padding:`${Space['3xl']}px`,
          maxHeight:'90vh', overflowY:'auto' }}>
          <ProgressBar step={step} />
          {step === 'about' && (
            <StepAbout name={name} setName={setName}
              onNext={() => setStep('birth')} onSkip={onSkip} />
          )}
          {step === 'birth' && (
            <StepBirth dob={dob} setDob={setDob}
              birthTime={birthTime} setBirthTime={setBirthTime}
              onNext={() => setStep('family')} onSkip={() => setStep('family')} />
          )}
          {step === 'family' && (
            <StepFamily family={family} setFamily={setFamily} onComplete={handleComplete} />
          )}
        </div>
      </div>
    </>
  )
}
