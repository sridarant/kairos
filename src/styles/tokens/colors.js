/**
 * colors.js — Semantic colour system
 * All components must import from here. No raw hex anywhere.
 */

// ─── Primitives (never used directly in components) ───────────────────────────
const P = {
  black:'#000', white:'#fff',
  gray1:'#111', gray2:'#1a1a1a', gray3:'#2a2a2a', gray4:'#666',
  yellow:'#facc15',
  green:'#4ade80', greenBg:'#052e16',
  red:'#f87171',   redBg:'#1c0505',
  amber:'#fb923c', amberTxt:'#fbbf24', amberBg:'#1c1000',
}

// ─── Semantic surface colours ─────────────────────────────────────────────────
export const Surface = Object.freeze({
  Background:     P.black,
  Base:           P.gray1,
  Card:           P.gray2,
  CardElevated:   '#1e1e1e',
  CardSubtle:     '#161616',
  Line:           P.gray3,
  Divider:        P.gray3,
  Overlay:        'rgba(0,0,0,0.7)',
})

// ─── Semantic text colours ────────────────────────────────────────────────────
export const Text = Object.freeze({
  Primary:   P.white,
  Secondary: P.gray4,
  Muted:     '#444',
  Accent:    P.yellow,
  Inverse:   P.black,
})

// ─── Semantic status colours ──────────────────────────────────────────────────
export const Status = Object.freeze({
  Success:     P.green,
  SuccessBg:   P.greenBg,
  Warning:     P.amberTxt,
  WarningBg:   P.amberBg,
  Danger:      P.red,
  DangerBg:    P.redBg,
  Information: '#60a5fa',
  Highlight:   P.yellow,
  Caution:     P.amber,
})

// ─── Confidence colours ───────────────────────────────────────────────────────
export const Confidence = Object.freeze({
  High:   P.green,
  Medium: P.yellow,
  Low:    P.red,
})

// ─── Outlook colours ──────────────────────────────────────────────────────────
export const Outlook = Object.freeze({
  Positive:    P.green,
  Neutral:     P.yellow,
  Challenging: P.red,
})

// ─── Timeline quality colours ─────────────────────────────────────────────────
export const Quality = Object.freeze({
  Excellent:    P.green,
  Good:         P.yellow,
  Moderate:     P.amber,
  'Low energy': P.red,
})

// ─── Category colours (subtle backgrounds for icons) ─────────────────────────
export const Category = Object.freeze({
  career:        '#1e293b',
  finance:       '#1a1a0a',
  relationships: '#1f0f0f',
  health:        '#0a1f0a',
  learning:      '#0f0f1f',
  travel:        '#0a1a1f',
  spiritual:     '#1a0f1a',
  family:        '#1a1000',
  communication: '#0a1a2a',
  default:       P.gray2,
})

// ─── Accent ───────────────────────────────────────────────────────────────────
export const Accent = P.yellow

// ─── Legacy aliases (keeps existing components working during migration) ───────
export const CONF_COLOR = Confidence
export const QUALITY_COLOR = Quality
