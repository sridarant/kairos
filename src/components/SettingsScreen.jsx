/**
 * SettingsScreen v30.10.6 — Settings as a proper page.
 *
 * R2.4A: Settings must NOT be a modal. It is a primary navigation destination.
 * Sections: Profile / Family / Data / About
 * No cards wrapping every section. Section dividers + whitespace.
 * All state management mirrored from ProfileModal (no logic duplication).
 */
import { useState, useRef } from 'react'
import { Surface, Text, Status, Accent, Radius, Space, FontSize, FontWeight } from '../styles/tokens/index.js'
import { RELEASE_VERSION, CALC_VERSION } from '../../lib/utils/version.js'

// ─── Shared field helpers ─────────────────────────────────────────────────────

function inp(extra = {}) {
  return {
    width:'100%', padding:`${Space.sm}px ${Space.md}px`, borderRadius:Radius.md,
    border:`1px solid ${Surface.Line}`, background:Surface.Base, fontSize:FontSize.Body,
    color:Text.Primary, fontFamily:'inherit', outline:'none', boxSizing:'border-box', ...extra
  }
}

function SectionLabel({ children }) {
  return (
    <p style={{ fontSize:FontSize.Label, textTransform:'uppercase', letterSpacing:'0.08em',
      color:Text.Muted, fontWeight:FontWeight.Medium, marginBottom:Space.lg }}>
      {children}
    </p>
  )
}

function Divider() {
  return <div style={{ borderTop:`1px solid ${Surface.Line}`, margin:`${Space['3xl']}px 0` }} />
}

function FieldRow({ label, children }) {
  return (
    <div style={{ marginBottom:Space.lg }}>
      <label style={{ display:'block', fontSize:FontSize.Caption, color:Text.Secondary, marginBottom:Space.xs }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ─── Profile fields ───────────────────────────────────────────────────────────

function ProfileFields({ data, setField, isFamily = false }) {
  return (
    <div>
      <FieldRow label={isFamily ? 'Name' : 'Your name'}>
        <input value={data.name || ''} onChange={e => setField('name', e.target.value)}
          placeholder={isFamily ? "Family member's name" : 'Your name'} style={inp()} />
      </FieldRow>
      {isFamily && (
        <FieldRow label="Relationship">
          <input value={data.relationship || ''} onChange={e => setField('relationship', e.target.value)}
            placeholder="Partner, child, parent…" style={inp()} />
        </FieldRow>
      )}
      <FieldRow label="Date of birth (DD-MM-YYYY)">
        <input value={data.dob || ''} onChange={e => setField('dob', e.target.value)}
          placeholder="20-10-1976" style={inp()} inputMode="numeric" />
      </FieldRow>
      <FieldRow label="Birth time (HH:MM, 24-hour)">
        <input value={data.birth_time || ''} onChange={e => setField('birth_time', e.target.value)}
          placeholder="11:25" style={inp()} inputMode="numeric" />
      </FieldRow>
      <FieldRow label="Place of birth">
        <input value={data.place_of_birth || ''} onChange={e => setField('place_of_birth', e.target.value)}
          placeholder="Chennai, Tamil Nadu, India" style={inp()} />
      </FieldRow>
    </div>
  )
}

// ─── Calculation quality row ──────────────────────────────────────────────────

function CalcQuality({ profile }) {
  const hasDob      = !!profile.dob?.trim()
  const hasTime     = !!profile.birth_time?.trim()
  const hasLocation = !!profile.place_of_birth?.trim()
  const quality = (hasDob && hasTime && hasLocation) ? 'High' : (hasDob && hasTime) ? 'Medium' : hasDob ? 'Low' : 'Demo'
  const pct = (hasDob && hasTime && hasLocation) ? 4 : (hasDob && hasTime) ? 3 : hasDob ? 2 : 1
  const color = quality === 'High' ? '#059669' : quality === 'Medium' ? Accent : Text.Muted
  return (
    <p style={{ fontSize:FontSize.Caption, color, marginBottom:Space.xl }}>
      Calculation quality: {quality} ({pct}/4 fields complete)
    </p>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SettingsScreen({ identity, onSave, onExport, onImport, onDelete }) {
  const profile    = identity?.profile || {}
  const initFamily = identity?.family  || []

  const [pData,        setPData]        = useState({ ...profile })
  const [family,       setFamily]       = useState(initFamily.map(m => ({ ...m })))
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [addingMember, setAddingMember] = useState(false)
  const [confirmDelete,setConfirmDelete]= useState(false)
  const [draft, setDraft] = useState({ name:'', dob:'', birth_time:'', place_of_birth:'', relationship:'', notes:'' })
  const fileRef = useRef(null)

  function setPField(field, val) { setPData(d => ({ ...d, [field]:val })) }
  function setDraftField(f, v)   { setDraft(d  => ({ ...d, [f]:v })) }
  function setFamilyField(i, f, v) {
    setFamily(prev => prev.map((m, idx) => idx === i ? { ...m, [f]:v } : m))
  }

  async function handleSave() {
    setSaving(true)
    await onSave(pData, family)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
  }

  return (
    <div style={{ minHeight:'100%', background:Surface.Background,
      padding:`${Space['3xl']}px ${Space.xl}px`, maxWidth:540, margin:'0 auto' }}>

      <p style={{ fontSize:FontSize.Heading2, fontWeight:FontWeight.Bold,
        color:Text.Primary, marginBottom:Space['2xl'] }}>
        Settings
      </p>

      {/* ── PROFILE ─────────────────────────────────────────────────────── */}
      <SectionLabel>Profile</SectionLabel>
      <CalcQuality profile={pData} />
      <ProfileFields data={pData} setField={setPField} />

      <button onClick={handleSave} disabled={saving}
        style={{ padding:`${Space.md}px ${Space.xl}px`, background:Accent, color:'#fff',
          border:'none', borderRadius:Radius.lg, cursor:'pointer', fontSize:FontSize.Body,
          fontFamily:'inherit', fontWeight:FontWeight.SemiBold, marginBottom:Space.md, minHeight:44 }}>
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save profile'}
      </button>

      <Divider />

      {/* ── FAMILY ──────────────────────────────────────────────────────── */}
      <SectionLabel>Family</SectionLabel>

      {family.map((m, i) => (
        <div key={i} style={{ marginBottom:Space['2xl'],
          paddingBottom:Space.xl, borderBottom:`1px solid ${Surface.Line}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:Space.md }}>
            <p style={{ fontSize:FontSize.Body, fontWeight:FontWeight.SemiBold, color:Text.Primary }}>
              {m.name || `Family member ${i+1}`}
            </p>
            <button onClick={() => setFamily(f => f.filter((_, j) => j !== i))}
              style={{ background:'none', border:'none', color:Status.Danger,
                cursor:'pointer', fontSize:FontSize.Caption, fontFamily:'inherit' }}>
              Remove
            </button>
          </div>
          <ProfileFields data={m} setField={(f, v) => setFamilyField(i, f, v)} isFamily />
        </div>
      ))}

      {addingMember ? (
        <div style={{ marginBottom:Space.xl }}>
          <p style={{ fontSize:FontSize.Body, fontWeight:FontWeight.SemiBold,
            color:Text.Primary, marginBottom:Space.md }}>New member</p>
          <ProfileFields data={draft} setField={setDraftField} isFamily />
          <div style={{ display:'flex', gap:Space.sm }}>
            <button onClick={addFamilyMember} disabled={!draft.name.trim()}
              style={{ padding:`${Space.sm}px ${Space.md}px`, background:Accent, color:'#fff',
                border:'none', borderRadius:Radius.md, cursor:'pointer',
                fontFamily:'inherit', fontSize:FontSize.Caption, minHeight:40 }}>
              Add
            </button>
            <button onClick={() => setAddingMember(false)}
              style={{ padding:`${Space.sm}px ${Space.md}px`, background:'none', color:Text.Secondary,
                border:`1px solid ${Surface.Line}`, borderRadius:Radius.md, cursor:'pointer',
                fontFamily:'inherit', fontSize:FontSize.Caption, minHeight:40 }}>
              Cancel
            </button>
          </div>
        </div>
      ) : family.length < 5 && (
        <button onClick={() => setAddingMember(true)}
          style={{ width:'100%', padding:`${Space.md}px`, background:'none',
            border:`1px dashed ${Surface.Line}`, borderRadius:Radius.md, cursor:'pointer',
            color:Text.Secondary, fontSize:FontSize.Caption, fontFamily:'inherit', minHeight:44 }}>
          + Add family member
        </button>
      )}

      <Divider />

      {/* ── DATA ────────────────────────────────────────────────────────── */}
      <SectionLabel>Data</SectionLabel>
      <p style={{ fontSize:FontSize.Caption, color:Text.Secondary, lineHeight:1.6, marginBottom:Space.xl }}>
        Your profile is stored only on this device. Export as a backup or import to restore.
      </p>

      <div style={{ display:'flex', gap:Space.sm, marginBottom:Space['2xl'] }}>
        <button onClick={onExport}
          style={{ padding:`${Space.sm}px ${Space.md}px`, background:'none',
            border:`1px solid ${Surface.Line}`, borderRadius:Radius.md, cursor:'pointer',
            fontFamily:'inherit', fontSize:FontSize.Caption, color:Text.Primary, minHeight:40 }}>
          Export
        </button>
        <button onClick={() => fileRef.current?.click()}
          style={{ padding:`${Space.sm}px ${Space.md}px`, background:'none',
            border:`1px solid ${Surface.Line}`, borderRadius:Radius.md, cursor:'pointer',
            fontFamily:'inherit', fontSize:FontSize.Caption, color:Text.Primary, minHeight:40 }}>
          Import
        </button>
        <input ref={fileRef} type="file" accept=".json" onChange={handleImportFile} style={{ display:'none' }} />
      </div>

      <div style={{ borderTop:`1px solid ${Surface.Line}`, paddingTop:Space.xl }}>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)}
            style={{ padding:`${Space.sm}px ${Space.md}px`, background:'none',
              border:`1px solid ${Status.Danger}`, borderRadius:Radius.md, cursor:'pointer',
              fontFamily:'inherit', fontSize:FontSize.Caption, color:Status.Danger, minHeight:40 }}>
            Delete all data
          </button>
        ) : (
          <div>
            <p style={{ fontSize:FontSize.Caption, color:Status.Danger, marginBottom:Space.sm }}>
              This cannot be undone. Delete everything?
            </p>
            <div style={{ display:'flex', gap:Space.sm }}>
              <button onClick={() => { onDelete(); setConfirmDelete(false) }}
                style={{ padding:`${Space.sm}px ${Space.md}px`, background:Status.Danger, color:'#fff',
                  border:'none', borderRadius:Radius.md, cursor:'pointer',
                  fontFamily:'inherit', fontSize:FontSize.Caption, minHeight:40 }}>
                Delete
              </button>
              <button onClick={() => setConfirmDelete(false)}
                style={{ padding:`${Space.sm}px ${Space.md}px`, background:'none',
                  border:`1px solid ${Surface.Line}`, borderRadius:Radius.md, cursor:'pointer',
                  fontFamily:'inherit', fontSize:FontSize.Caption, color:Text.Secondary, minHeight:40 }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <Divider />

      {/* ── ABOUT ───────────────────────────────────────────────────────── */}
      <SectionLabel>About</SectionLabel>
      <div style={{ display:'flex', flexDirection:'column', gap:Space.sm }}>
        {[
          ['Version',             RELEASE_VERSION],
          ['Calculation version', CALC_VERSION],
          ['Data storage',        'On-device only'],
        ].map(([label, value]) => (
          <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:FontSize.Caption, color:Text.Secondary }}>{label}</span>
            <span style={{ fontSize:FontSize.Caption, color:Text.Primary, fontWeight:FontWeight.Medium }}>{value}</span>
          </div>
        ))}
      </div>

      <p style={{ fontSize:FontSize.Badge, color:Text.Muted, marginTop:Space['2xl'], lineHeight:1.6 }}>
        Kairos provides personal timing guidance for reflection and planning. It is not a substitute
        for professional medical, legal, or financial advice.
      </p>

    </div>
  )
}
