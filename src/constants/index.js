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

// Colours live in src/styles/tokens/colors.js — do not add raw hex here.

// ─── Feedback outcomes ────────────────────────────────────────────────────────
export const FEEDBACK = Object.freeze({
  HELPFUL:      'helpful',
  NOT_HELPFUL:  'not_helpful',
  SKIPPED:      'skipped',
  PENDING:      'pending'
})

// ─── Tab identifiers ──────────────────────────────────────────────────────────
export const TABS = Object.freeze({
  TODAY:    'today',
  PLANNER:  'planner',
  FAMILY:   'family',
  JOURNAL:  'journal',
  SETTINGS: 'settings'   // R2.4A: canonical Settings tab; TABS.MORE removed
})

// ─── Async state labels ───────────────────────────────────────────────────────
export const ASYNC_STATE = Object.freeze({
  IDLE:    'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  EMPTY:   'empty',
  ERROR:   'error'
})
