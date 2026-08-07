/**
 * ProfileModal v30.3 — Profile editing with export/import/delete.
 * WS8, WS9, WS13: edit, save confirmation, export, import, delete.
 */
import { useState, useRef } from 'react'
import {
  PrimaryButton, SecondaryButton, DangerButton, GhostButton, FieldLabel, Caption
} from './common/index.jsx'
import {
  Surface, Text, Status, Accent, Radius, Space, Pad,
  FontSize, FontWeight, Z
} from '../styles/tokens/index.js'

function formatDob(raw) {
  const d = raw.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0,2)}-${d.slice(2)}`
  return `${d.slice(0,2)}-${d.slice(2,4)}-${d.slice(4)}`
}

function inp(extra = {}) {
  return {
    width:'100%', background: Surface.Card, border:`1px solid ${Surface.Line}`,
    borderRadius: Radius.input, padding: Pad.input, fontSize: FontSize.Body,
    color: Text.Primary, fontFamily:'inherit', outline:'none',
    boxSizing:'border-box', ...extra
  }
}

// Profile completeness health indicator
function ProfileHealth({ users }) {
  const primary = users[0] || {}
  const checks = [
    { label:'Name', ok: !!primary.name?.trim() },
    { label:'Date of birth', ok: !!primary.dob?.trim() },
    { label:'Birth time', ok: !!primary.birth_time?.trim() },
    { label:'Family', ok: users.length > 1 }
  ]
  const score = checks.filter(c => c.ok).length
  const color = score >= 3 ? '#4ade80' : score >= 2 ? '#facc15' : '#f87171'
  return (
    <div style={{ background: Surface.Card, borderRadius: Radius.lg,
      padding: Pad.cardSm, marginBottom: Space.xl }}>
      <p style={{ fontSize: FontSize.Caption, color: Text.Secondary, marginBottom: Space.sm }}>
        Profile completeness
      </p>
      <div style={{ display:'flex', gap: Space.xs, marginBottom: Space.sm }}>
        {checks.map((c, i) => (
          <div key={i} style={{ flex:1, height:3, borderRadius:2,
            background: c.ok ? color : Surface.Line }} />
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: Space.xs }}>
        {checks.map((c, i) => (
          <p key={i} style={{ fontSize: FontSize.Badge,
            color: c.ok ? '#4ade80' : Text.Secondary }}>
            {c.ok ? '✓' : '○'} {c.label}
          </p>
        ))}
      </div>
    </div>
  )
}

export default function ProfileModal({
  onClose, users, onSave, onExport, onImport, onDelete
}) {
  const [list, setList] = useState(
    users.length > 0 ? users : [{ name:'', dob:'', birth_time:'', type:'primary' }]
  )
  const [saving,  setSaving]  = useState(false)
  const [tab,     setTab]     = useState('profile')  // profile | data
  const [confirm, setConfirm] = useState(false)
  const fileRef = useRef(null)

  const MAX = 4

  function update(i, field, val) {
    setList(prev => prev.map((u, idx) => idx === i ? { ...u, [field]: val } : u))
  }
  function updateDob(i, val) { update(i, 'dob', formatDob(val)) }

  async function save() {
    setSaving(true)
    await onSave(list.filter(u => u.name?.trim()))
    setSaving(false)
    onClose()
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const result = await onImport(text)
    if (!result.ok) alert(`Import failed: ${result.error}`)
    else onClose()
  }

  const tabBtn = (id, label) => (
    <button key={id} onClick={() => setTab(id)} style={{
      flex:1, background: tab === id ? Accent : Surface.Card, color: tab === id ? '#000' : Text.Secondary,
      border:'none', borderRadius: Radius.md, padding:`8px 0`,
      fontSize: FontSize.Caption, fontWeight: FontWeight.Bold,
      cursor:'pointer', fontFamily:'inherit', minHeight:34 }}>
      {label}
    </button>
  )

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
        backdropFilter:'blur(4px)', zIndex: Z.overlay }} />
      <div className="slide-up" style={{
        position:'fixed', left:0, right:0, bottom:0, maxWidth:448, margin:'0 auto',
        maxHeight:'92vh', overflowY:'auto', background: Surface.Base,
        borderRadius: Radius.modal, zIndex: Z.modal }}>
        <div style={{ padding: Pad.modal }}>
          <div style={{ width:36, height:4, background: Surface.Line, borderRadius: Radius.sm,
            margin:`0 auto ${Space.xl}px` }} />

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            marginBottom: Space.xl }}>
            <p style={{ fontSize: FontSize.Heading3, fontWeight: FontWeight.Bold, color: Text.Primary }}>
              Your Profile
            </p>
            <button onClick={onClose} aria-label="Close" style={{ background:'none', border:'none',
              color: Text.Secondary, fontSize: FontSize.Heading2, cursor:'pointer', minHeight:32 }}>✕</button>
          </div>

          {/* Tab bar */}
          <div style={{ display:'flex', gap: Space.sm, marginBottom: Space.xl }}>
            {tabBtn('profile', 'Profile')}
            {tabBtn('data', 'Data')}
          </div>

          {tab === 'profile' && (<>
            <ProfileHealth users={list} />

            {list.map((user, i) => (
              <div key={i} style={{ background: Surface.Card, borderRadius: Radius['2xl'],
                padding: Pad.cardLg, marginBottom: Space.md }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                  marginBottom: Space.md }}>
                  <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold, color: Text.Primary }}>
                    {i === 0 ? '👤 You' : `👥 Family member ${i}`}
                  </p>
                  {i > 0 && (
                    <button onClick={() => setList(l => l.filter((_,j) => j !== i))} style={{
                      background:'none', border:'none', color: Status.Danger,
                      cursor:'pointer', fontSize: FontSize.Caption, fontFamily:'inherit' }}>
                      Remove
                    </button>
                  )}
                </div>
                {[
                  { label:'Name',                   field:'name',       ph:'Your name',    type:'text' },
                  { label:'Date of birth',           field:'dob',        ph:'DD-MM-YYYY',   type:'text' },
                  { label:'Birth time (optional)',   field:'birth_time', ph:'HH:MM',        type:'text' }
                ].map(({ label, field, ph }) => (
                  <div key={field} style={{ marginBottom: Space.md }}>
                    <FieldLabel text={label} />
                    <input placeholder={ph} value={user[field] || ''}
                      onChange={e => field === 'dob'
                        ? updateDob(i, e.target.value)
                        : update(i, field, e.target.value)}
                      style={inp()} />
                  </div>
                ))}
              </div>
            ))}

            {list.length < MAX && (
              <button onClick={() => setList(l => [...l, { name:'', dob:'', birth_time:'', type:'family' }])}
                style={{ width:'100%', background: Surface.Card, border:`1px dashed ${Surface.Line}`,
                  borderRadius: Radius.card, padding: Pad.cardSm, color: Text.Secondary,
                  fontSize: FontSize.Body, cursor:'pointer', fontFamily:'inherit',
                  marginBottom: Space.xl }}>
                + Add family member
              </button>
            )}

            <PrimaryButton onClick={save} loading={saving} fullWidth>Save Profile</PrimaryButton>
          </>)}

          {tab === 'data' && (
            <div>
              <p style={{ fontSize: FontSize.Body, color: Text.Secondary, lineHeight:1.6,
                marginBottom: Space['3xl'] }}>
                Your profile is stored locally on this device. Export it as a backup or to
                transfer to another device.
              </p>

              <div style={{ marginBottom: Space.xl }}>
                <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold,
                  color: Text.Primary, marginBottom: Space.sm }}>Export Profile</p>
                <Caption style={{ marginBottom: Space.md }}>
                  Downloads your profile as a JSON file.
                </Caption>
                <SecondaryButton onClick={onExport}>Export kairos-profile.json</SecondaryButton>
              </div>

              <div style={{ marginBottom: Space['3xl'] }}>
                <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold,
                  color: Text.Primary, marginBottom: Space.sm }}>Import Profile</p>
                <Caption style={{ marginBottom: Space.md }}>
                  Restore a previously exported profile file.
                </Caption>
                <input ref={fileRef} type="file" accept=".json" onChange={handleImport}
                  style={{ display:'none' }} />
                <SecondaryButton onClick={() => fileRef.current?.click()}>
                  Import from file
                </SecondaryButton>
              </div>

              <div style={{ borderTop:`1px solid ${Surface.Line}`, paddingTop: Space.xl }}>
                <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold,
                  color: Status.Danger, marginBottom: Space.sm }}>Delete Profile</p>
                <Caption style={{ marginBottom: Space.md }}>
                  Removes all profile data from this device. This cannot be undone.
                </Caption>
                {!confirm ? (
                  <DangerButton onClick={() => setConfirm(true)}>Delete profile</DangerButton>
                ) : (
                  <div>
                    <Caption style={{ marginBottom: Space.sm, color: Status.Danger }}>
                      Are you sure? All profile data will be deleted.
                    </Caption>
                    <div style={{ display:'flex', gap: Space.sm }}>
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
