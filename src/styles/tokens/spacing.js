/**
 * spacing.js — Spacing scale
 * Replace all hardcoded margin/padding/gap with these tokens.
 */

export const Space = Object.freeze({
  0:  0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
})

// Semantic aliases
export const Pad = Object.freeze({
  card:    '12px 14px',
  cardSm:  '10px 12px',
  cardLg:  '16px 18px',
  section: '16px',
  modal:   '24px 16px 100px',
  input:   '10px 12px',
})

export const Gap = Object.freeze({
  xs:  Space.xs,
  sm:  Space.sm,
  md:  Space.md,
  card: Space.sm,
  grid: Space.sm,
})
