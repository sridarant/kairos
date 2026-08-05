/**
 * ProfileModal — Profile & family member setup. Migrated to Design System.
 */
import { useState } from 'react'
import { PrimaryButton, SecondaryButton, DangerButton, FieldLabel, Caption } from './common/index.jsx'
import { Surface, Text, Status, Accent, Radius, Space, Pad, Gap, FontSize, FontWeight, Z } from '../styles/tokens/index.js'

const MAX_MEMBERS = 3

function formatDob(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return digits.slice(0, 2) + '-' + digits.slice(2)
  return digits.slice(0, 2) + '-' + digits.slice(2, 4) + '-' + digits.slice(4)
}

function inputStyle() {
  return {
    width:'100%', background: Surface.Card, border:`1px solid ${Surface.Line}`,
    borderRadius: Radius.input, padding: Pad.input, fontSize: FontSize.Body,
    color: Text.Primary, fontFamily:'inherit', outline:'none', boxSizing:'border-box'
  }
}

export default function ProfileModal({ onClose, users, onSave }) {
  const [list, setList] = useState(
    users.length > 0 ? users : [{ name:'', dob:'', birth_time:'', type:'' }]
  )
  const [saving, setSaving] = useState(false)

  function update(i, field, val) {
    setList(prev => prev.map((u, idx) => idx === i ? { ...u, [field]: val } : u))
  }
  function updateDob(i, val) { update(i, 'dob', formatDob(val)) }
  function addMember() {
    if (list.length < MAX_MEMBERS) setList(p => [...p, { name:'', dob:'', birth_time:'', type:'family' }])
  }
  function remove(i) { setList(p => p.filter((_, idx) => idx !== i)) }
  async function save() {
    setSaving(true)
    await onSave(list.filter(u => u.name?.trim()))
    setSaving(false)
    onClose()
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background: Surface.Overlay, backdropFilter:'blur(4px)', zIndex: Z.overlay }} />
      <div className="slide-up" style={{
        position:'fixed', left:0, right:0, bottom:0, maxWidth:448, margin:'0 auto',
        maxHeight:'92vh', overflowY:'auto', background: Surface.Base, borderRadius: Radius.modal, zIndex: Z.modal }}>
        <div style={{ padding: Pad.modal }}>
          <div style={{ width:36, height:4, background: Surface.Line, borderRadius: Radius.sm, margin:`0 auto ${Space.xl}px` }} />
          <p style={{ fontSize: FontSize.Heading3, fontWeight: FontWeight.Bold, marginBottom: Space.xs, color: Text.Primary }}>Your Profile</p>
          <Caption style={{ marginBottom: Space['3xl'] }}>Enter details for personalised recommendations.</Caption>

          {list.map((user, i) => (
            <div key={i} style={{ background: Surface.Card, borderRadius: Radius['2xl'], padding: Pad.cardLg, marginBottom: Space.md }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: Space.md }}>
                <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold, color: Text.Primary }}>
                  {i === 0 ? 'You' : `Family Member ${i + 1}`}
                </p>
                {i > 0 && (
                  <button onClick={() => remove(i)} style={{ background:'none', border:'none', color: Status.Danger,
                    cursor:'pointer', fontSize: FontSize.Caption, fontFamily:'inherit' }}>Remove</button>
                )}
              </div>

              {[
                { label:'Name', field:'name', placeholder:'Your name', type:'text' },
                { label:'Date of Birth', field:'dob', placeholder:'DD-MM-YYYY', type:'text' },
                { label:'Birth Time (optional)', field:'birth_time', placeholder:'HH:MM', type:'text' },
              ].map(({ label, field, placeholder, type }) => (
                <div key={field} style={{ marginBottom: Space.md }}>
                  <FieldLabel text={label} />
                  <input
                    type={type} placeholder={placeholder} value={user[field] || ''}
                    onChange={e => field === 'dob' ? updateDob(i, e.target.value) : update(i, field, e.target.value)}
                    style={inputStyle()} />
                </div>
              ))}
            </div>
          ))}

          {list.length < MAX_MEMBERS && (
            <SecondaryButton onClick={addMember} style={{ width:'100%', marginBottom: Space.md }}>
              + Add Family Member
            </SecondaryButton>
          )}

          <PrimaryButton onClick={save} loading={saving} fullWidth>Save Profile</PrimaryButton>
        </div>
      </div>
    </>
  )
}
