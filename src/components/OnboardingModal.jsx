/**
 * OnboardingModal — First-run experience.
 *
 * WS6: Welcoming onboarding instead of a blank form.
 * Three steps: About You → Birth Details → Family (optional)
 * Does not feel like filling a form.
 */
import { useState } from 'react'
import {
  PrimaryButton, SecondaryButton, GhostButton, FieldLabel, Caption
} from './common/index.jsx'
import {
  Surface, Text, Accent, Status, Radius, Space, Pad,
  FontSize, FontWeight, Z
} from '../styles/tokens/index.js'

const STEPS = ['about', 'birth', 'family']

function ProgressBar({ step }) {
  const i = STEPS.indexOf(step)
  return (
    <div style={{ display:'flex', gap: Space.sm, marginBottom: Space['3xl'] }}>
      {STEPS.map((s, idx) => (
        <div key={s} style={{ flex:1, height:3, borderRadius:2,
          background: idx <= i ? Accent : Surface.Line }} />
      ))}
    </div>
  )
}

function inp(extra = {}) {
  return {
    width:'100%', background: Surface.Card, border:`1px solid ${Surface.Line}`,
    borderRadius: Radius.input, padding: Pad.input, fontSize: FontSize.Body,
    color: Text.Primary, fontFamily:'inherit', outline:'none',
    boxSizing:'border-box', ...extra
  }
}

function formatDob(raw) {
  const d = raw.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0,2)}-${d.slice(2)}`
  return `${d.slice(0,2)}-${d.slice(2,4)}-${d.slice(4)}`
}

// ─── Step 1: About You ────────────────────────────────────────────────────────
function StepAbout({ data, onChange, onNext }) {
  return (
    <div>
      <p style={{ fontSize: FontSize.Heading2, fontWeight: FontWeight.Bold,
        color: Text.Primary, marginBottom: Space.sm }}>
        Welcome to Kairos
      </p>
      <p style={{ fontSize: FontSize.Body, color: Text.Secondary, lineHeight:1.6,
        marginBottom: Space['3xl'] }}>
        Kairos is your daily life planning companion. It uses Vedic astrology to help
        you make better decisions.
        <br /><br />
        Let's start with your name so Kairos can greet you personally.
      </p>
      <FieldLabel text="Your name" />
      <input placeholder="e.g. Priya" value={data.name}
        onChange={e => onChange('name', e.target.value)}
        style={{ ...inp(), marginBottom: Space['3xl'] }} />
      <PrimaryButton onClick={() => data.name.trim() && onNext()} fullWidth
        disabled={!data.name.trim()}>
        Continue →
      </PrimaryButton>
    </div>
  )
}

// ─── Step 2: Birth Details ────────────────────────────────────────────────────
function StepBirth({ data, onChange, onNext, onSkip }) {
  return (
    <div>
      <p style={{ fontSize: FontSize.Heading2, fontWeight: FontWeight.Bold,
        color: Text.Primary, marginBottom: Space.sm }}>
        Your birth details
      </p>
      <p style={{ fontSize: FontSize.Body, color: Text.Secondary, lineHeight:1.6,
        marginBottom: Space['3xl'] }}>
        Kairos uses your birth date and time to calculate planetary positions
        and generate personalised recommendations.
        Your details are stored only on this device.
      </p>

      <div style={{ marginBottom: Space.xl }}>
        <FieldLabel text="Date of birth" />
        <input placeholder="DD-MM-YYYY" value={data.dob}
          onChange={e => onChange('dob', formatDob(e.target.value))}
          style={inp()} />
        <Caption style={{ marginTop: Space.xs }}>Enter as day-month-year, e.g. 15-03-1990</Caption>
      </div>

      <div style={{ marginBottom: Space['3xl'] }}>
        <FieldLabel text="Birth time (optional but recommended)" />
        <input placeholder="HH:MM (24-hour)" value={data.birth_time}
          onChange={e => onChange('birth_time', e.target.value)}
          style={inp()} />
        <Caption style={{ marginTop: Space.xs }}>
          More accurate birth time = more accurate timing recommendations
        </Caption>
      </div>

      <PrimaryButton onClick={() => data.dob.length >= 8 && onNext()} fullWidth
        disabled={data.dob.length < 8}>
        Continue →
      </PrimaryButton>
      <div style={{ marginTop: Space.md, textAlign:'center' }}>
        <button onClick={onSkip} style={{ background:'none', border:'none', color: Text.Secondary,
          fontSize: FontSize.Caption, cursor:'pointer', fontFamily:'inherit' }}>
          Skip birth details for now
        </button>
      </div>
    </div>
  )
}

// ─── Step 3: Family ───────────────────────────────────────────────────────────
function StepFamily({ family, setFamily, onComplete }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newMember, setNewMember] = useState({ name:'', dob:'', birth_time:'' })

  function addMember() {
    if (!newMember.name.trim()) return
    setFamily([...family, { ...newMember, type:'family' }])
    setNewMember({ name:'', dob:'', birth_time:'' })
    setShowAdd(false)
  }

  return (
    <div>
      <p style={{ fontSize: FontSize.Heading2, fontWeight: FontWeight.Bold,
        color: Text.Primary, marginBottom: Space.sm }}>
        Your family (optional)
      </p>
      <p style={{ fontSize: FontSize.Body, color: Text.Secondary, lineHeight:1.6,
        marginBottom: Space['3xl'] }}>
        Kairos can show guidance for your whole family and suggest the best shared windows.
        You can always add family members later in Settings.
      </p>

      {family.map((m, i) => (
        <div key={i} style={{ background: Surface.Card, borderRadius: Radius.card,
          padding: Pad.cardSm, marginBottom: Space.sm, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize: FontSize.Body, color: Text.Primary }}>
            {m.name} {m.dob ? `· ${m.dob}` : ''}
          </span>
          <button onClick={() => setFamily(family.filter((_,j) => j !== i))} style={{
            background:'none', border:'none', color: Status.Danger, cursor:'pointer',
            fontSize: FontSize.Body, fontFamily:'inherit' }}>✕</button>
        </div>
      ))}

      {!showAdd && family.length < 3 && (
        <button onClick={() => setShowAdd(true)} style={{
          width:'100%', background: Surface.Card, border:`1px dashed ${Surface.Line}`,
          borderRadius: Radius.card, padding: Pad.cardSm, color: Text.Secondary,
          fontSize: FontSize.Body, cursor:'pointer', fontFamily:'inherit', marginBottom: Space['3xl'] }}>
          + Add family member
        </button>
      )}

      {showAdd && (
        <div style={{ background: Surface.Card, borderRadius: Radius.card, padding: Pad.card,
          marginBottom: Space['3xl'] }}>
          <div style={{ marginBottom: Space.md }}>
            <FieldLabel text="Name" />
            <input placeholder="Name" value={newMember.name}
              onChange={e => setNewMember(m => ({...m, name: e.target.value}))} style={inp()} />
          </div>
          <div style={{ marginBottom: Space.md }}>
            <FieldLabel text="Date of birth (optional)" />
            <input placeholder="DD-MM-YYYY" value={newMember.dob}
              onChange={e => setNewMember(m => ({...m, dob: formatDob(e.target.value)}))} style={inp()} />
          </div>
          <div style={{ display:'flex', gap: Space.sm }}>
            <SecondaryButton onClick={() => setShowAdd(false)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={addMember} disabled={!newMember.name.trim()}>Add</PrimaryButton>
          </div>
        </div>
      )}

      {!showAdd && (
        <PrimaryButton onClick={onComplete} fullWidth>
          {family.length > 0 ? 'Set up Kairos →' : 'Start without family →'}
        </PrimaryButton>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OnboardingModal({ onComplete, onSkip }) {
  const [step, setStep] = useState('about')
  const [data, setData] = useState({ name:'', dob:'', birth_time:'' })
  const [family, setFamily] = useState([])

  function updateField(field, val) { setData(d => ({...d, [field]: val})) }

  function handleComplete() {
    const primary = { name: data.name, dob: data.dob, birth_time: data.birth_time, type:'primary' }
    onComplete([primary, ...family])
  }

  return (
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)',
        backdropFilter:'blur(6px)', zIndex: Z.overlay }} />
      <div className="slide-up" style={{
        position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
        zIndex: Z.modal, padding: Space.xl }}>
        <div style={{
          width:'100%', maxWidth:480, background: Surface.Base,
          borderRadius: Radius['2xl'], padding:`${Space['3xl']}px ${Space['3xl']}px`,
          maxHeight:'90vh', overflowY:'auto' }}>

          <ProgressBar step={step} />

          {step === 'about' && (
            <StepAbout data={data} onChange={updateField} onNext={() => setStep('birth')} />
          )}
          {step === 'birth' && (
            <StepBirth data={data} onChange={updateField}
              onNext={() => setStep('family')}
              onSkip={() => setStep('family')} />
          )}
          {step === 'family' && (
            <StepFamily family={family} setFamily={setFamily}
              onComplete={handleComplete} />
          )}

          {/* Skip onboarding entirely */}
          {step === 'about' && (
            <div style={{ marginTop: Space.xl, textAlign:'center' }}>
              <button onClick={onSkip} style={{ background:'none', border:'none',
                color: Text.Secondary, fontSize: FontSize.Caption,
                cursor:'pointer', fontFamily:'inherit' }}>
                Continue in demo mode
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
