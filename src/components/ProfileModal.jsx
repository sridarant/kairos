/**
 * ProfileModal — Profile editing, data management.
 * All persistence goes through props (onSave, onDelete, onExport, onImport).
 * No direct storage access.
 *
 * WS8: onSave(profileFields, familyArray) → identityManager.saveProfile()
 * WS9: onDelete() → identityManager.clear()
 * WS10: onExport() → identityManager.export(), onImport(json) → identityManager.import()
 */
import { useState, useRef } from 'react'
import {
  PrimaryButton, SecondaryButton, DangerButton, FieldLabel, Caption, TabButton
} from './common/index.jsx'
import {
  Surface, Text, Status, Accent, Radius, Space, Pad, FontSize, FontWeight, Z
} from '../styles/tokens/index.js'

function formatDob(raw) {
  const d = raw.replace(/\D/g,'').slice(0,8)
  if (d.length<=2) return d
  if (d.length<=4) return `${d.slice(0,2)}-${d.slice(2)}`
  return `${d.slice(0,2)}-${d.slice(2,4)}-${d.slice(4)}`
}

function inp() {
  return {
    width:'100%', background:Surface.Card, border:`1px solid ${Surface.Line}`,
    borderRadius:Radius.input, padding:Pad.input, fontSize:FontSize.Body,
    color:Text.Primary, fontFamily:'inherit', outline:'none', boxSizing:'border-box'
  }
}

function ProfileHealth({ profile, family }) {
  const checks = [
    { label:'Name',        ok: !!profile.name?.trim() },
    { label:'Date of birth', ok: !!profile.dob?.trim() },
    { label:'Birth time',  ok: !!profile.birth_time?.trim() },
    { label:'Family',      ok: family.length > 0 }
  ]
  const score = checks.filter(c => c.ok).length
  const color = score >= 3 ? '#4ade80' : score >= 2 ? '#facc15' : '#f87171'
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

export default function ProfileModal({ onClose, identity, onSave, onDelete, onExport, onImport }) {
  const profile = identity?.profile || {}
  const initFamily = identity?.family || []

  const [activeTab, setActiveTab]   = useState('profile')
  const [name,      setName]        = useState(profile.name       || '')
  const [dob,       setDob]         = useState(profile.dob        || '')
  const [birthTime, setBirthTime]   = useState(profile.birth_time || '')
  const [family,    setFamily]      = useState(initFamily)
  const [saving,    setSaving]      = useState(false)
  const [confirm,   setConfirm]     = useState(false)
  const [addingMember, setAddingMember] = useState(false)
  const [draft,     setDraft]       = useState({ name:'', dob:'', birth_time:'' })
  const fileRef = useRef(null)

  async function handleSave() {
    setSaving(true)
    await onSave({ name:name.trim(), dob:dob.trim(), birth_time:birthTime.trim() }, family)
    setSaving(false)
    onClose()
  }

  function addFamilyMember() {
    if (!draft.name.trim()) return
    setFamily(prev => [...prev, { ...draft }])
    setDraft({ name:'', dob:'', birth_time:'' })
    setAddingMember(false)
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const text   = await file.text()
    const result = await onImport(text)
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
          <div style={{ width:36, height:4, background:Surface.Line, borderRadius:2,
            margin:`0 auto ${Space.xl}px` }} />
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            marginBottom:Space.xl }}>
            <p style={{ fontSize:FontSize.Heading3, fontWeight:FontWeight.Bold, color:Text.Primary }}>
              Profile
            </p>
            <button onClick={onClose} aria-label="Close" style={{ background:'none', border:'none',
              color:Text.Secondary, fontSize:FontSize.Heading2, cursor:'pointer', minHeight:32 }}>✕</button>
          </div>

          {/* Tab bar */}
          <div style={{ display:'flex', gap:Space.sm, marginBottom:Space.xl }}>
            {['profile','data'].map(t => (
              <TabButton key={t} label={t === 'profile' ? 'Profile' : 'Data'}
                active={activeTab === t} onClick={() => setActiveTab(t)} />
            ))}
          </div>

          {activeTab === 'profile' && (<>
            <ProfileHealth profile={{ name, dob, birth_time:birthTime }} family={family} />

            {/* Primary profile */}
            <div style={{ background:Surface.Card, borderRadius:Radius['2xl'], padding:Pad.cardLg, marginBottom:Space.md }}>
              <p style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Bold, color:Text.Primary, marginBottom:Space.md }}>
                👤 You
              </p>
              {[
                { label:'Name', value:name, set:setName, ph:'Your name' },
                { label:'Date of birth', value:dob, set:v=>setDob(formatDob(v)), ph:'DD-MM-YYYY' },
                { label:'Birth time (optional)', value:birthTime, set:setBirthTime, ph:'HH:MM' }
              ].map(({ label, value, set, ph }) => (
                <div key={label} style={{ marginBottom:Space.md }}>
                  <FieldLabel text={label} />
                  <input value={value} onChange={e=>set(e.target.value)} placeholder={ph} style={inp()} />
                </div>
              ))}
            </div>

            {/* Family members */}
            {family.map((m, i) => (
              <div key={i} style={{ background:Surface.Card, borderRadius:Radius.card,
                padding:Pad.card, marginBottom:Space.sm,
                display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <p style={{ fontSize:FontSize.Body, color:Text.Primary, fontWeight:FontWeight.Bold }}>{m.name}</p>
                  {m.dob && <p style={{ fontSize:FontSize.Caption, color:Text.Secondary }}>{m.dob}</p>}
                </div>
                <button onClick={() => setFamily(f=>f.filter((_,j)=>j!==i))} style={{
                  background:'none', border:'none', color:Status.Danger,
                  cursor:'pointer', fontSize:FontSize.Body, fontFamily:'inherit' }}>✕</button>
              </div>
            ))}

            {addingMember ? (
              <div style={{ background:Surface.Card, borderRadius:Radius.card, padding:Pad.card, marginBottom:Space.md }}>
                {[
                  { label:'Name', field:'name', ph:'Name' },
                  { label:'Date of birth (optional)', field:'dob', ph:'DD-MM-YYYY', fmt:true }
                ].map(({ label, field, ph, fmt }) => (
                  <div key={field} style={{ marginBottom:Space.md }}>
                    <FieldLabel text={label} />
                    <input value={draft[field]} placeholder={ph} style={inp()}
                      onChange={e => setDraft(d=>({ ...d, [field]: fmt ? formatDob(e.target.value) : e.target.value }))} />
                  </div>
                ))}
                <div style={{ display:'flex', gap:Space.sm }}>
                  <SecondaryButton onClick={() => setAddingMember(false)}>Cancel</SecondaryButton>
                  <PrimaryButton onClick={addFamilyMember} disabled={!draft.name.trim()}>Add</PrimaryButton>
                </div>
              </div>
            ) : family.length < 3 && (
              <button onClick={() => setAddingMember(true)} style={{ width:'100%', background:Surface.Card,
                border:`1px dashed ${Surface.Line}`, borderRadius:Radius.card, padding:Pad.cardSm,
                color:Text.Secondary, fontSize:FontSize.Body, cursor:'pointer', fontFamily:'inherit',
                marginBottom:Space.xl }}>
                + Add family member
              </button>
            )}

            <PrimaryButton onClick={handleSave} loading={saving} fullWidth>Save Profile</PrimaryButton>
          </>)}

          {activeTab === 'data' && (
            <div>
              <p style={{ fontSize:FontSize.Body, color:Text.Secondary, lineHeight:1.6, marginBottom:Space['3xl'] }}>
                Your profile is stored only on this device under a single storage key.
                Export it as a backup, or import a previously exported file.
              </p>

              <div style={{ marginBottom:Space.xl }}>
                <p style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Bold, color:Text.Primary, marginBottom:Space.sm }}>
                  Export Profile
                </p>
                <Caption style={{ marginBottom:Space.md }}>Downloads kairos-identity.json</Caption>
                <SecondaryButton onClick={onExport}>Export profile</SecondaryButton>
              </div>

              <div style={{ marginBottom:Space['3xl'] }}>
                <p style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Bold, color:Text.Primary, marginBottom:Space.sm }}>
                  Import Profile
                </p>
                <Caption style={{ marginBottom:Space.md }}>Restore from a previously exported file</Caption>
                <input ref={fileRef} type="file" accept=".json" onChange={handleImportFile} style={{ display:'none' }} />
                <SecondaryButton onClick={() => fileRef.current?.click()}>Import from file</SecondaryButton>
              </div>

              <div style={{ borderTop:`1px solid ${Surface.Line}`, paddingTop:Space.xl }}>
                <p style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Bold, color:Status.Danger, marginBottom:Space.sm }}>
                  Delete Profile
                </p>
                <Caption style={{ marginBottom:Space.md }}>Removes all data from this device. Cannot be undone.</Caption>
                {!confirm ? (
                  <DangerButton onClick={() => setConfirm(true)}>Delete profile</DangerButton>
                ) : (
                  <div>
                    <Caption style={{ marginBottom:Space.sm, color:Status.Danger }}>
                      Are you sure? All data will be deleted.
                    </Caption>
                    <div style={{ display:'flex', gap:Space.sm }}>
                      <DangerButton onClick={() => { onDelete(); onClose() }}>Yes, delete</DangerButton>
                      <SecondaryButton onClick={() => setConfirm(false)}>Cancel</SecondaryButton>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
