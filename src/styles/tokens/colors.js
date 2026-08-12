/**
 * colors.js — Semantic colour system (light-first, v30.8)
 *
 * ONE source of truth for all colours.
 * Remove all other colour definitions from: index.css, constants/index.js,
 * userProfile.js, and any component-level raw hex.
 *
 * Design direction: calm, minimal, spacious. Colour signals meaning only.
 * Not decorative. Not loud.
 */

// ─── Primitives ───────────────────────────────────────────────────────────────
// Never use these directly in components.
const P = {
  white:   '#ffffff',
  gray50:  '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray700: '#374151',
  gray900: '#111827',
  black:   '#000000',

  // Signal palette — used sparingly, only for meaning
  emerald500: '#10b981',
  emerald700: '#047857',
  amber500:   '#f59e0b',
  amber700:   '#b45309',
  red500:     '#ef4444',
  red700:     '#b91c1c',
  indigo500:  '#6366f1',
  indigo600:  '#4f46e5',
}

// ─── Surface ──────────────────────────────────────────────────────────────────
export const Surface = Object.freeze({
  // R2.4A: Tonal layering — page visibly differs from cards.
  // NOT a dark theme. Soft warm gray canvas with white primary surfaces.
  Background:  P.gray100,   // page canvas: #f3f4f6 — visibly different from white cards
  Base:        P.white,     // primary surfaces (nav, modals)
  Card:        P.white,     // content cards (on gray canvas these float cleanly)
  Subtle:      P.gray50,    // secondary surface: #f9fafb — between canvas and white
  Line:        P.gray200,   // borders: #e5e7eb — subtle
  Divider:     P.gray200,
  Overlay:     'rgba(0,0,0,0.4)',
})

// ─── Text ─────────────────────────────────────────────────────────────────────
export const Text = Object.freeze({
  Primary:   P.gray900,
  Secondary: P.gray500,
  Muted:     P.gray400,
  Inverse:   P.white,
  Link:      P.indigo600,
})

// ─── Status ───────────────────────────────────────────────────────────────────
export const Status = Object.freeze({
  Success:   P.emerald500,
  Danger:    P.red500,
  Warning:   P.amber500,
  Caution:   P.amber500,
  Info:      P.indigo500,
})

// ─── Accent ───────────────────────────────────────────────────────────────────
// One primary accent. Use for interactive elements, primary actions, best windows.
export const Accent = P.indigo600

// ─── Suitability tiers ───────────────────────────────────────────────────────
// Map engine suitabilityTier → colour. Used for the day rating only.
export const Suitability = Object.freeze({
  Excellent:   P.emerald500,
  Good:        P.emerald700,
  Neutral:     P.gray500,
  Moderate:    P.amber700,
  Challenging: P.red500,
})

// ─── Outlook (legacy alias — consumed by dailyBrief adapter) ─────────────────
export const Outlook = Object.freeze({
  Positive:    P.emerald500,
  Neutral:     P.gray500,
  Challenging: P.red500,
})

// ─── Timeline quality ─────────────────────────────────────────────────────────
export const Quality = Object.freeze({
  Excellent:    P.emerald500,
  Good:         P.emerald700,
  Neutral:      P.gray500,
  Moderate:     P.amber500,
  'Low energy': P.gray400,
})

// ─── Confidence ───────────────────────────────────────────────────────────────
export const Confidence = Object.freeze({
  High:   P.emerald500,
  Medium: P.amber500,
  Low:    P.gray400,
})

// ─── Profile status ───────────────────────────────────────────────────────────
export const ProfileStatus = Object.freeze({
  demo:         P.gray400,
  incomplete:   P.amber500,
  basic:        P.amber700,
  personalised: P.emerald500,
})

// ─── Legacy aliases ───────────────────────────────────────────────────────────
// Kept so older components compile without changes during migration.
export const CONF_COLOR   = Confidence
export const QUALITY_COLOR = Quality

// ─── Category ────────────────────────────────────────────────────────────────
// Light theme: subtle tinted backgrounds replaced by plain card surface.
export const Category = Object.freeze({
  default: P.white,
})
