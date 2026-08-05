/**
 * /src/constants/index.js — Centralised application constants.
 * No magic numbers, hardcoded colours, or repeated labels in components.
 */

// ─── Category icons ───────────────────────────────────────────────────────────
export const CAT_ICON = Object.freeze({
  career:        '💼',
  finance:       '💰',
  money:         '💰',
  relationships: '❤️',
  health:        '🌿',
  learning:      '📚',
  travel:        '✈️',
  spiritual:     '🛕',
  home:          '🏠',
  family:        '👨‍👩‍👧',
  shopping:      '🛍️',
  medical:       '🏥',
  communication: '💬',
  business:      '🏢',
  property:      '🏠',
  legal:         '⚖️',
  planning:      '📋',
  education:     '📚'
})

// ─── Confidence levels ────────────────────────────────────────────────────────
export const CONFIDENCE = Object.freeze({ HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' })

export const CONF_COLOR = Object.freeze({
  High:   '#4ade80',
  Medium: '#facc15',
  Low:    '#f87171'
})

// ─── Quality labels → dot colors on timeline ─────────────────────────────────
export const QUALITY_COLOR = Object.freeze({
  Excellent:    '#4ade80',
  Good:         '#facc15',
  Moderate:     '#fb923c',
  'Low energy': '#f87171'
})

// ─── Design tokens (keeps components free of magic values) ───────────────────
export const DESIGN = Object.freeze({
  yellow:  '#facc15',
  green:   '#4ade80',
  amber:   '#fb923c',
  red:     '#f87171',
  gray2:   'var(--gray-2)',
  gray3:   'var(--gray-3)',
  gray4:   'var(--gray-4)',
  white:   '#fff',
  cardR:   14,     // border-radius for cards
  pad:     '12px 14px',
  gap:     8
})

// ─── Feedback outcomes ────────────────────────────────────────────────────────
export const FEEDBACK = Object.freeze({
  HELPFUL:      'helpful',
  NOT_HELPFUL:  'not_helpful',
  SKIPPED:      'skipped',
  PENDING:      'pending'
})

// ─── Tab identifiers ──────────────────────────────────────────────────────────
export const TABS = Object.freeze({
  TODAY:   'today',
  PLANNER: 'planner',
  FAMILY:  'family',
  JOURNAL: 'journal',
  MORE:    'more'
})

// ─── Async state labels ───────────────────────────────────────────────────────
export const ASYNC_STATE = Object.freeze({
  IDLE:    'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  EMPTY:   'empty',
  ERROR:   'error'
})
