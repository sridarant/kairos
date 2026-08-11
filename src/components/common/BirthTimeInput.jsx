/**
 * BirthTimeInput — Smart time entry.
 * User types "1125" → displays "11:25"
 * User types "905" → displays "09:05"
 * Supports AM/PM selection (converts to 24-hour internally).
 * Always stores 24-hour HH:MM format.
 */
import { useState } from 'react'
import { Surface, Text, Accent, Radius, Space, FontSize, FontWeight } from '../../styles/tokens/index.js'

function parseRaw(raw, ampm) {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (!digits) return ''
  let h, m
  if (digits.length <= 2) {
    h = parseInt(digits, 10); m = 0
  } else {
    h = parseInt(digits.slice(0, digits.length - 2), 10)
    m = parseInt(digits.slice(-2), 10)
  }
  if (isNaN(h) || isNaN(m)) return ''
  // Apply AM/PM conversion
  if (ampm === 'PM' && h < 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0
  if (h > 23 || m > 59) return ''
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}

function to12h(value24) {
  if (!value24) return { display:'', ampm:'AM' }
  const [hStr, mStr] = value24.split(':')
  let h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  if (h > 12) h -= 12
  if (h === 0) h = 12
  return { display:`${h}${String(m).padStart(2,'0')}`, ampm }
}

export default function BirthTimeInput({ value = '', onChange, placeholder = 'HHMM', style = {} }) {
  const init = to12h(value)
  const [raw,  setRaw]  = useState(init.display)
  const [ampm, setAmpm] = useState(init.ampm)

  function handleChange(e) {
    const digits = e.target.value.replace(/\D/g,'').slice(0,4)
    setRaw(digits)
    const time24 = parseRaw(digits, ampm)
    onChange(time24)
  }

  function handleAmpm(val) {
    setAmpm(val)
    const time24 = parseRaw(raw, val)
    onChange(time24)
  }

  // Display with colon inserted
  function displayValue(d) {
    if (!d) return ''
    if (d.length <= 2) return d
    return d.slice(0, d.length - 2) + ':' + d.slice(-2)
  }

  const inp = {
    background: Surface.Card, border:`1px solid ${Surface.Line}`,
    borderRadius: `${Radius.input}px 0 0 ${Radius.input}px`,
    padding:'10px 12px', fontSize: FontSize.Body,
    color: Text.Primary, fontFamily:'inherit', outline:'none',
    flex:1, minWidth:0, ...style
  }

  return (
    <div style={{ display:'flex', alignItems:'stretch' }}>
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={displayValue(raw)}
        onChange={handleChange}
        style={inp}
      />
      {['AM','PM'].map(v => (
        <button key={v} onClick={() => handleAmpm(v)} type="button"
          style={{
            background: ampm === v ? Accent : Surface.Card,
            color: ampm === v ? Text.Inverse : Text.Secondary,
            border:`1px solid ${Surface.Line}`,
            borderLeft: 'none',
            borderRadius: v === 'PM' ? `0 ${Radius.input}px ${Radius.input}px 0` : '0',
            padding:'10px 10px', fontSize: FontSize.Caption,
            fontWeight: FontWeight.Bold, cursor:'pointer', fontFamily:'inherit',
            minWidth:36
          }}>
          {v}
        </button>
      ))}
    </div>
  )
}
