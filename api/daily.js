export const SLOTS = [
  { time: '07:00–09:00', decision: 1,  communication: 1,  risk: 0,  focus: 1  },
  { time: '09:00–11:00', decision: 2,  communication: 2,  risk: 0,  focus: 2  },
  { time: '11:00–13:00', decision: 1,  communication: 2,  risk: 0,  focus: 1  },
  { time: '13:00–15:00', decision: 0,  communication: -1, risk: -1, focus: 0  },
  { time: '15:00–17:00', decision: -1, communication: -2, risk: -1, focus: -1 },
  { time: '17:00–19:00', decision: -2, communication: -1, risk: -2, focus: -1 }
]

export function scoreSlot(slot, seed = 0) {
  const base = slot.decision + slot.communication + slot.focus - slot.risk
  const jitter = ((seed % 3) - 1) * 0.5
  return base + jitter
}

export function scoredSlots(seed) {
  return SLOTS.map(s => ({ ...s, score: scoreSlot(s, seed) }))
}

const DO_MSGS = [
  'Make important decisions and have key conversations',
  'Tackle complex work requiring full focus',
  'Send proposals, pitches, or critical messages',
  'Negotiate, plan, or lead discussions',
  'Start high-stakes projects with clear intent'
]

const AVOID_MSGS = [
  'Avoid financial decisions — risk tolerance is low',
  'Avoid high-stakes calls or commitments',
  'Avoid reactive responses — clarity is reduced',
  'Avoid multitasking on anything critical',
  'Avoid impulsive choices under pressure'
]

const WATCH_MSGS = [
  'Energy dip likely — pace yourself',
  'Decision fatigue building — take breaks',
  'Focus may waver — remove distractions',
  'Transition period — wrap up, don\'t start new things',
  'Stress peaks around context-switching'
]

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const seed = new Date().getDate()
  const slots = scoredSlots(seed)

  const sorted = [...slots].sort((a, b) => b.score - a.score)
  const golden = sorted[0]
  const worst  = sorted[sorted.length - 1]
  const medium = [...slots].sort((a, b) => Math.abs(a.score) - Math.abs(b.score))[0]

  const confidence = Math.min(100, Math.max(0, Math.round(((golden.score + 6) / 12) * 100)))

  res.status(200).json({
    golden_window:      golden.time,
    do:                 DO_MSGS[seed % DO_MSGS.length],
    avoid:              `${worst.time} — ` + AVOID_MSGS[(seed + 1) % AVOID_MSGS.length],
    watch:              `${medium.time} — ` + WATCH_MSGS[(seed + 2) % WATCH_MSGS.length],
    confidence_summary: confidence
  })
}
