import { useState } from 'react'

const MAX_MEMBERS = 3

export default function ProfileModal({ onClose, users, onSave }) {
  const [list, setList] = useState(
    users.length > 0 ? users : [{ name: '', dob: '', birth_time: '', type: '' }]
  )

  function update(i, field, val) {
    setList(prev => prev.map((u, idx) => idx === i ? { ...u, [field]: val } : u))
  }

  function addMember() {
    if (list.length >= MAX_MEMBERS) return
    setList(prev => [...prev, { name: '', dob: '', birth_time: '', type: '' }])
  }

  function removeMember(i) {
    setList(prev => prev.filter((_, idx) => idx !== i))
  }

  function handleSave() {
    const cleaned = list.filter(u => u.name.trim())
    onSave(cleaned)
    onClose()
  }

  const input = {
    width: '100%', background: 'var(--gray-2)', border: 'none', borderRadius: 10,
    color: '#fff', fontSize: 14, padding: '10px 12px', outline: 'none', fontFamily: 'inherit'
  }

  const label = { fontSize: 11, color: 'var(--gray-4)', marginBottom: 4, display: 'block' }

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)', zIndex: 40
      }} />

      <div className="slide-up" style={{
        position: 'fixed', bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: '100%', maxWidth: 448,
        background: 'var(--gray-1)',
        borderRadius: '20px 20px 0 0',
        padding: '24px 16px 40px',
        zIndex: 50,
        maxHeight: '85dvh',
        overflowY: 'auto'
      }}>
        <div style={{ width: 36, height: 4, background: 'var(--gray-3)', borderRadius: 2, margin: '0 auto 20px' }} />
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Profiles</h2>
        <p style={{ fontSize: 13, color: 'var(--gray-4)', marginBottom: 20 }}>Up to {MAX_MEMBERS} members</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {list.map((u, i) => (
            <div key={i} style={{ background: 'var(--gray-2)', borderRadius: 12, padding: 14, position: 'relative' }}>
              {list.length > 1 && (
                <button onClick={() => removeMember(i)} style={{
                  position: 'absolute', top: 10, right: 10,
                  background: 'none', border: 'none', color: 'var(--gray-4)',
                  fontSize: 16, cursor: 'pointer', lineHeight: 1
                }}>✕</button>
              )}
              <p style={{ fontSize: 12, color: 'var(--yellow)', fontWeight: 600, marginBottom: 12 }}>
                {i === 0 ? 'You' : `Member ${i + 1}`}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <span style={label}>Name</span>
                  <input value={u.name} onChange={e => update(i, 'name', e.target.value)}
                    placeholder="Your name" style={input} />
                </div>
                <div>
                  <span style={label}>Date of Birth (optional)</span>
                  <input value={u.dob} onChange={e => update(i, 'dob', e.target.value)}
                    placeholder="DD-MM-YYYY" style={input} />
                </div>
                <div>
                  <span style={label}>Birth Time (optional — for Lagna)</span>
                  <input value={u.birth_time} onChange={e => update(i, 'birth_time', e.target.value)}
                    placeholder="HH:MM (e.g. 06:30)" style={input} />
                </div>
                <div>
                  <span style={label}>Type (optional)</span>
                  <select value={u.type} onChange={e => update(i, 'type', e.target.value)}
                    style={{ ...input, appearance: 'none' }}>
                    <option value="">— select —</option>
                    <option value="work-focused">Work-focused</option>
                    <option value="student">Student</option>
                    <option value="creative">Creative</option>
                    <option value="entrepreneur">Entrepreneur</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {list.length < MAX_MEMBERS && (
          <button onClick={addMember} className="scale-tap" style={{
            width: '100%', marginTop: 12, padding: '11px',
            background: 'var(--gray-2)', border: '1px dashed var(--gray-3)',
            borderRadius: 12, color: 'var(--gray-4)', fontSize: 14,
            cursor: 'pointer', fontFamily: 'inherit'
          }}>+ Add family member</button>
        )}

        <button onClick={handleSave} className="scale-tap" style={{
          width: '100%', marginTop: 14, padding: '14px',
          background: 'var(--yellow)', border: 'none', borderRadius: 12,
          color: '#000', fontSize: 16, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit'
        }}>Save Profiles</button>
      </div>
    </>
  )
}
