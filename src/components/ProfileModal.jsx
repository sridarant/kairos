/**
 * ProfileModal v30.3.2 — Complete birth details for primary user and family members.
 * Fields: Name, DOB, Birth Time (smart), Place of Birth, Relationship (family), Notes.
 */
import { useState, useRef } from 'react'
import BirthTimeInput from './common/BirthTimeInput.jsx'
import {
  PrimaryButton, SecondaryButton, DangerButton, TabButton, FieldLabel, Caption
} from './common/index.jsx'
import { Surface, Text, Status, Accent, Radius, Space, Pad, FontSize, FontWeight, Z } from '../styles/tokens/index.js'

function formatDob(raw) {
  const d = raw.replace(/\D/g,'').slice(0,8)
  if (d.length<=2) return d
  if (d.length<=4) return `${d.slice(0,2)}-${d.slice(2)}`
  return `${d.slice(0,2)}-${d.slice(2,4)}-${d.slice(4)}`
}

function inp(extra={}) {
  return {
    width:'100%', background:Surface.Card, border:`1px solid ${Surface.Line}`,
    borderRadius:Radius.input, padding:Pad.input, fontSize:FontSize.Body,
    color:Text.Primary, fontFamily:'inherit', outline:'none', boxSizing:'border-box', ...extra
  }
}

const RELATIONSHIPS = ['Spouse / Partner','Child','Parent','Sibling','Other']

function ProfileHealth({ profile, family }) {
  const checks = [
    { label:'Name',          ok: !!profile.name?.trim() },
    { label:'Date of birth', ok: !!profile.dob?.trim() },
    { label:'Birth time',    ok: !!profile.birth_time?.trim() },
    { label:'Place of birth',ok: !!profile.place_of_birth?.trim() },
  ]
  const score = checks.filter(c=>c.ok).length
  const color = score >= 4 ? '#4ade80' : score >= 2 ? '#facc15' : '#f87171'
  return (
    <div style={{ background:Surface.Card, borderRadius:Radius.lg, padding:Pad.cardSm, marginBottom:Space.xl }}>
      <p style={{ fontSize:FontSize.Caption, color:Text.Secondary, marginBottom:Space.sm }}>
        Profile completeness
      </p>
      <div style={{ display:'flex', gap:Space.xs, marginBottom:Space.sm }}>
        {checks.map((c,i) => (
          <div key={i} style={{ flex:1, height:3, borderRadius:2, background:c.ok ? color : Surface.Line }} />
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:Space.xs }}>
        {checks.map((c,i) => (
          <p key={i} style={{ fontSize:FontSize.Badge, color:c.ok ? '#4ade80' : Text.Secondary }}>
            {c.ok ? '✓' : '○'} {c.label}
          </p>
        ))}
      </div>
    </div>
  )
}

function ProfileFields({ data, setField, isFamily = false }) {
  return (<>
    <div style={{ marginBottom:Space.md }}>
      <FieldLabel text="Name" />
      <input value={data.name||''} onChange={e=>setField('name',e.target.value)}
        placeholder={isFamily ? "Family member's name" : 'Your name'} style={inp()} />
    </div>
    {isFamily && (
      <div style={{ marginBottom:Space.md }}>
        <FieldLabel text="Relationship" />
        <select value={data.relationship||''} onChange={e=>setField('relationship',e.target.value)}
          style={{ ...inp(), appearance:'none' }}>
          <option value="">— select —</option>
          {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
    )}
    <div style={{ marginBottom:Space.md }}>
      <FieldLabel text="Date of birth" />
      <input value={data.dob||''} onChange={e=>setField('dob',formatDob(e.target.value))}
        placeholder="DD-MM-YYYY" style={inp()} />
    </div>
    <div style={{ marginBottom:Space.md }}>
      <FieldLabel text="Birth time (optional)" />
      <BirthTimeInput value={data.birth_time||''} onChange={v=>setField('birth_time',v)} />
    </div>
    <div style={{ marginBottom:Space.md }}>
      <FieldLabel text="Place of birth" />
      <input value={data.place_of_birth||''} onChange={e=>setField('place_of_birth',e.target.value)}
        placeholder="City, State, Country" style={inp()} />
    </div>
    {isFamily && (
      <div style={{ marginBottom:Space.md }}>
        <FieldLabel text="Notes (optional)" />
        <input value={data.notes||''} onChange={e=>setField('notes',e.target.value)}
          placeholder="Any notes" style={inp()} />
      </div>
    )}
  </>)
}

export default function ProfileModal({ onClose, identity, onSave, onDelete, onExport, onImport }) {
  const profile = identity?.profile || {}
  const initFamily = identity?.family || []

  const [activeTab, setActiveTab] = useState('profile')
  const [pData,  setPData]  = useState({ ...profile })
  const [family, setFamily] = useState(initFamily.map(m=>({...m})))
  const [saving, setSaving] = useState(false)
  const [confirm,setConfirm]= useState(false)
  const [addingMember, setAddingMember] = useState(false)
  const [draft, setDraft]   = useState({ name:'', dob:'', birth_time:'', place_of_birth:'', relationship:'', notes:'' })
  const fileRef = useRef(null)

  function setPField(field, val) { setPData(d=>({...d,[field]:val})) }
  function setDraftField(f, v)   { setDraft(d=>({...d,[f]:v})) }
  function setFamilyField(i, f, v) {
    setFamily(prev => prev.map((m,idx) => idx===i ? {...m,[f]:v} : m))
  }

  async function handleSave() {
    setSaving(true)
    await onSave(pData, family)
    setSaving(false)
    onClose()
  }

  function addFamilyMember() {
    if (!draft.name.trim()) return
    setFamily(prev => [...prev, { ...draft }])
    setDraft({ name:'', dob:'', birth_time:'', place_of_birth:'', relationship:'', notes:'' })
    setAddingMember(false)
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await onImport(await file.text())
    if (!result.ok) alert(`Import failed: ${result.errors?.join(', ')}`)
    else onClose()
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
        backdropFilter:'blur(4px)', zIndex:Z.overlay }} />
      <div className="slide-up" style={{
        position:'fixed', left:0, right:0, bottom:0, maxWidth:448, margin:'0 auto',
        maxHeight:'92vh', overflowY:'auto', background:Surface.Base,
        borderRadius:Radius.modal, zIndex:Z.modal }}>
        <div style={{ padding:Pad.modal }}>
          <div style={{ width:36, height:4, background:Surface.Line, borderRadius:2, margin:`0 auto ${Space.xl}px` }} />
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:Space.xl }}>
            <p style={{ fontSize:FontSize.Heading3, fontWeight:FontWeight.Bold, color:Text.Primary }}>Profile</p>
            <button onClick={onClose} aria-label="Close" style={{ background:'none', border:'none',
              color:Text.Secondary, fontSize:FontSize.Heading2, cursor:'pointer', minHeight:32 }}>✕</button>
          </div>

          <div style={{ display:'flex', gap:Space.sm, marginBottom:Space.xl }}>
            {['profile','data'].map(t => (
              <TabButton key={t} label={t==='profile'?'Profile':'Data'}
                active={activeTab===t} onClick={()=>setActiveTab(t)} />
            ))}
          </div>

          {activeTab === 'profile' && (<>
            <ProfileHealth profile={pData} family={family} />

            {/* Primary profile */}
            <div style={{ background:Surface.Card, borderRadius:Radius['2xl'], padding:Pad.cardLg, marginBottom:Space.md }}>
              <p style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Bold, color:Text.Primary, marginBottom:Space.md }}>
                👤 You
              </p>
              <ProfileFields data={pData} setField={setPField} />
            </div>

            {/* Family members */}
            {family.map((m, i) => (
              <div key={i} style={{ background:Surface.Card, borderRadius:Radius.card, padding:Pad.card, marginBottom:Space.sm }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:Space.md }}>
                  <p style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Bold, color:Text.Primary }}>
                    👥 {m.name || `Family Member ${i+1}`}
                  </p>
                  <button onClick={() => setFamily(f=>f.filter((_,j)=>j!==i))} style={{
                    background:'none', border:'none', color:Status.Danger,
                    cursor:'pointer', fontSize:FontSize.Caption, fontFamily:'inherit' }}>Remove</button>
                </div>
                <ProfileFields data={m} setField={(f,v)=>setFamilyField(i,f,v)} isFamily />
              </div>
            ))}

            {addingMember ? (
              <div style={{ background:Surface.Card, borderRadius:Radius.card, padding:Pad.card, marginBottom:Space.md }}>
                <p style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Bold, color:Text.Primary, marginBottom:Space.md }}>
                  New Family Member
                </p>
                <ProfileFields data={draft} setField={setDraftField} isFamily />
                <div style={{ display:'flex', gap:Space.sm }}>
                  <SecondaryButton onClick={() => setAddingMember(false)}>Cancel</SecondaryButton>
                  <PrimaryButton onClick={addFamilyMember} disabled={!draft.name.trim()}>Add</PrimaryButton>
                </div>
              </div>
            ) : family.length < 5 && (
              <button onClick={() => setAddingMember(true)} style={{ width:'100%', background:Surface.Card,
                border:`1px dashed ${Surface.Line}`, borderRadius:Radius.card, padding:Pad.cardSm,
                color:Text.Secondary, fontSize:FontSize.Body, cursor:'pointer', fontFamily:'inherit',
                marginBottom:Space.xl }}>
                + Add family member
              </button>
            )}

            <PrimaryButton onClick={handleSave} loading={saving} fullWidth>Save Profile</PrimaryButton>
          </>)}

          {activeTab === 'data' && (<>
            <p style={{ fontSize:FontSize.Body, color:Text.Secondary, lineHeight:1.6, marginBottom:Space['3xl'] }}>
              Your profile is stored only on this device. Export as a backup or import to restore.
            </p>
            <div style={{ marginBottom:Space.xl }}>
              <p style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Bold, color:Text.Primary, marginBottom:Space.sm }}>
                Export
              </p>
              <Caption style={{ marginBottom:Space.md }}>Downloads kairos-identity.json</Caption>
              <SecondaryButton onClick={onExport}>Export profile</SecondaryButton>
            </div>
            <div style={{ marginBottom:Space['3xl'] }}>
              <p style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Bold, color:Text.Primary, marginBottom:Space.sm }}>
                Import
              </p>
              <Caption style={{ marginBottom:Space.md }}>Restore a previously exported file</Caption>
              <input ref={fileRef} type="file" accept=".json" onChange={handleImportFile} style={{ display:'none' }} />
              <SecondaryButton onClick={() => fileRef.current?.click()}>Import from file</SecondaryButton>
            </div>
            <div style={{ borderTop:`1px solid ${Surface.Line}`, paddingTop:Space.xl }}>
              <p style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Bold, color:Status.Danger, marginBottom:Space.sm }}>
                Delete
              </p>
              <Caption style={{ marginBottom:Space.md }}>Removes all data. Cannot be undone.</Caption>
              {!confirm ? (
                <DangerButton onClick={()=>setConfirm(true)}>Delete profile</DangerButton>
              ) : (
                <div>
                  <Caption style={{ marginBottom:Space.sm, color:Status.Danger }}>Are you sure?</Caption>
                  <div style={{ display:'flex', gap:Space.sm }}>
                    <DangerButton onClick={()=>{onDelete();onClose()}}>Yes, delete</DangerButton>
                    <SecondaryButton onClick={()=>setConfirm(false)}>Cancel</SecondaryButton>
                  </div>
                </div>
              )}
            </div>
          </>)}
        </div>
      </div>
    </>
  )
}
