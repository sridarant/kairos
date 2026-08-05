/**
 * typography.js — Typography scale
 * One scale, used everywhere. Frozen after v29.0.
 */

export const FontSize = Object.freeze({
  // Named scale
  Display:      28,
  Heading1:     22,
  Heading2:     18,
  Heading3:     16,
  SectionTitle: 11,
  CardTitle:    13,
  Body:         13,
  BodySmall:    12,
  Caption:      11,
  Label:        10,
  Badge:        10,
  Time:         12,
  Confidence:   11,
})

export const FontWeight = Object.freeze({
  Regular: 400,
  Medium:  600,
  Bold:    700,
  Heavy:   800,
})

export const LetterSpacing = Object.freeze({
  Normal:  'normal',
  Label:   '0.07em',
  Caption: '0.05em',
  Tight:   '-0.01em',
  Display: '-0.02em',
})

export const LineHeight = Object.freeze({
  Tight:  1.2,
  Normal: 1.4,
  Loose:  1.55,
  Body:   1.5,
})

// ─── Pre-built text style objects ─────────────────────────────────────────────
export const TextStyle = Object.freeze({
  Display: {
    fontSize: FontSize.Display, fontWeight: FontWeight.Heavy,
    letterSpacing: LetterSpacing.Display, lineHeight: LineHeight.Tight,
  },
  Heading1: {
    fontSize: FontSize.Heading1, fontWeight: FontWeight.Bold,
    letterSpacing: LetterSpacing.Tight,
  },
  Heading2: { fontSize: FontSize.Heading2, fontWeight: FontWeight.Bold },
  Heading3: { fontSize: FontSize.Heading3, fontWeight: FontWeight.Bold },
  SectionTitle: {
    fontSize: FontSize.SectionTitle, fontWeight: FontWeight.Medium,
    letterSpacing: LetterSpacing.Label, textTransform: 'uppercase',
  },
  CardTitle: { fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold },
  Body:      { fontSize: FontSize.Body,      lineHeight: LineHeight.Body },
  BodySmall: { fontSize: FontSize.BodySmall, lineHeight: LineHeight.Normal },
  Caption:   { fontSize: FontSize.Caption,   lineHeight: LineHeight.Normal },
  Label: {
    fontSize: FontSize.Label, fontWeight: FontWeight.Medium,
    letterSpacing: LetterSpacing.Label, textTransform: 'uppercase',
  },
  Badge:      { fontSize: FontSize.Badge,  fontWeight: FontWeight.Medium },
  Time:       { fontSize: FontSize.Time,   fontWeight: FontWeight.Bold },
  Confidence: { fontSize: FontSize.Confidence, fontWeight: FontWeight.Bold },
})
