/**
 * OnboardingModal v30.3.2 — Full birth details capture.
 * Includes: Name, DOB, Birth Time (smart input), Place of Birth.
 * Family step: same fields + Relationship.
 */
import { useState } from 'react'
import BirthTimeInput from './common/BirthTimeInput.jsx'
import { PrimaryButton, SecondaryButton, FieldLabel, Caption } from './common/index.jsx'
import { Surface, Text, Status, Accent, Radius, Space, Pad, FontSize, FontWeight, Z } from '../styles/tokens/index.js'

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
      <input placeholder="e.g. Sridaran" value={name}
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

function StepBirth({ fields, set, onNext, onSkip }) {
  return (
    <div>
      <p style={{ fontSize:FontSize.Heading2, fontWeight:FontWeight.Bold, color:Text.Primary, marginBottom:Space.sm }}>
        Birth details
      </p>
      <p style={{ fontSize:FontSize.Body, color:Text.Secondary, lineHeight:1.6, marginBottom:Space['3xl'] }}>
        Used to calculate planetary positions and personalise your guidance.
        Your data stays on this device only.
      </p>
      <div style={{ marginBottom:Space.xl }}>
        <FieldLabel text="Date of birth" />
        <input placeholder="DD-MM-YYYY" value={fields.dob}
          onChange={e => set('dob', formatDob(e.target.value))} style={inp()} />
        <p style={{ fontSize:FontSize.Badge, color:Text.Secondary, marginTop:Space.xs }}>
          Day-month-year, e.g. 20-10-1976
        </p>
      </div>
      <div style={{ marginBottom:Space.xl }}>
        <FieldLabel text="Birth time (recommended)" />
        <BirthTimeInput value={fields.birth_time} onChange={v => set('birth_time', v)} placeholder="HHMM" />
        <p style={{ fontSize:FontSize.Badge, color:Text.Secondary, marginTop:Space.xs }}>
          Type digits e.g. 1125 for 11:25
        </p>
      </div>
      <div style={{ marginBottom:Space['3xl'] }}>
        <FieldLabel text="Place of birth (recommended)" />
        <input placeholder="e.g. Chennai, Tamil Nadu, India" value={fields.place_of_birth}
          onChange={e => set('place_of_birth', e.target.value)} style={inp()} />
        <p style={{ fontSize:FontSize.Badge, color:Text.Secondary, marginTop:Space.xs }}>
          City, state/region, country
        </p>
      </div>
      <PrimaryButton onClick={onNext} disabled={fields.dob.length < 8} fullWidth>Continue →</PrimaryButton>
      <div style={{ textAlign:'center', marginTop:Space.md }}>
        <button onClick={onSkip} style={{ background:'none', border:'none', color:Text.Secondary,
          fontSize:FontSize.Caption, cursor:'pointer', fontFamily:'inherit' }}>
          Skip birth details for now
        </button>
      </div>
    </div>
  )
}

const RELATIONSHIPS = ['Spouse / Partner','Child','Parent','Sibling','Other']

function FamilyMemberForm({ draft, setDraft, onAdd, onCancel }) {
  return (
    <div style={{ background:Surface.Card, borderRadius:Radius.card, padding:Pad.card, marginBottom:Space.md }}>
      {[
        { label:'Name', field:'name', ph:'Name' },
        { label:'Relationship', field:'relationship', type:'select' },
        { label:'Date of birth', field:'dob', ph:'DD-MM-YYYY', fmt:true },
        { label:'Place of birth', field:'place_of_birth', ph:'City, Country' },
      ].map(({ label, field, ph, fmt, type }) => (
        <div key={field} style={{ marginBottom:Space.md }}>
          <FieldLabel text={label} />
          {type === 'select' ? (
            <select value={draft[field] || ''} onChange={e=>setDraft(d=>({...d,[field]:e.target.value}))}
              style={{ ...inp(), appearance:'none' }}>
              <option value="">— select —</option>
              {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          ) : (
            <input value={draft[field] || ''} placeholder={ph} style={inp()}
              onChange={e => setDraft(d=>({ ...d, [field]: fmt ? formatDob(e.target.value) : e.target.value }))} />
          )}
        </div>
      ))}
      <div style={{ marginBottom:Space.md }}>
        <FieldLabel text="Birth time (optional)" />
        <BirthTimeInput value={draft.birth_time||''} onChange={v=>setDraft(d=>({...d,birth_time:v}))} />
      </div>
      <div style={{ display:'flex', gap:Space.sm }}>
        <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
        <PrimaryButton onClick={onAdd} disabled={!draft.name?.trim()}>Add</PrimaryButton>
      </div>
    </div>
  )
}

function StepFamily({ family, setFamily, onComplete }) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft]   = useState({ name:'', dob:'', birth_time:'', place_of_birth:'', relationship:'', notes:'' })

  function addMember() {
    if (!draft.name.trim()) return
    setFamily(prev => [...prev, { ...draft }])
    setDraft({ name:'', dob:'', birth_time:'', place_of_birth:'', relationship:'', notes:'' })
    setAdding(false)
  }

  return (
    <div>
      <p style={{ fontSize:FontSize.Heading2, fontWeight:FontWeight.Bold, color:Text.Primary, marginBottom:Space.sm }}>
        Your family
      </p>
      <p style={{ fontSize:FontSize.Body, color:Text.Secondary, lineHeight:1.6, marginBottom:Space['3xl'] }}>
        Kairos shows guidance for your whole family and suggests shared windows.
        Add family members now or later in Settings.
      </p>

      {family.map((m, i) => (
        <div key={i} style={{ background:Surface.Card, borderRadius:Radius.card, padding:Pad.cardSm,
          marginBottom:Space.sm, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ fontSize:FontSize.Body, color:Text.Primary, fontWeight:FontWeight.Bold }}>{m.name}</p>
            {m.relationship && <p style={{ fontSize:FontSize.Caption, color:Text.Secondary }}>{m.relationship}</p>}
          </div>
          <button onClick={() => setFamily(f => f.filter((_,j)=>j!==i))} style={{
            background:'none', border:'none', color:Status.Danger,
            cursor:'pointer', fontSize:FontSize.Body, fontFamily:'inherit' }}>✕</button>
        </div>
      ))}

      {adding
        ? <FamilyMemberForm draft={draft} setDraft={setDraft} onAdd={addMember} onCancel={() => setAdding(false)} />
        : family.length < 5 && (
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
  const [step,   setStep]   = useState('about')
  const [name,   setName]   = useState('')
  const [birth,  setBirth]  = useState({ dob:'', birth_time:'', place_of_birth:'' })
  const [family, setFamily] = useState([])

  function setBirthField(field, val) { setBirth(b => ({ ...b, [field]: val })) }

  function handleComplete() {
    onComplete({ name: name.trim(), ...birth }, family)
  }

  return (
    <>
      <div style={{ position:'fixed', inset:0, background:Surface.Overlay,
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
            <StepBirth fields={birth} set={setBirthField}
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
