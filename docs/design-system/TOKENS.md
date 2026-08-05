# Design Tokens Reference

## Colors (`src/styles/tokens/colors.js`)

### Surface
| Token | Value | Use |
|---|---|---|
| `Surface.Background` | `#000` | Page background |
| `Surface.Base` | `#111` | App shell |
| `Surface.Card` | `#1a1a1a` | Cards, panels |
| `Surface.CardElevated` | `#1e1e1e` | Raised cards (hero) |
| `Surface.Line` | `#2a2a2a` | Borders, dividers |
| `Surface.Overlay` | `rgba(0,0,0,0.7)` | Modal backdrop |

### Text
| Token | Value | Use |
|---|---|---|
| `Text.Primary` | `#fff` | Body text, headings |
| `Text.Secondary` | `#666` | Labels, captions |
| `Text.Accent` | `#facc15` | Highlighted text |
| `Text.Inverse` | `#000` | Text on yellow |

### Status
| Token | Use |
|---|---|
| `Status.Success` / `SuccessBg` | Positive outcomes, confirmations |
| `Status.Warning` / `WarningBg` | Cautions, moderate signals |
| `Status.Danger` / `DangerBg` | Avoidance, errors |
| `Status.Highlight` | Accent highlight (yellow) |
| `Status.Caution` | Amber-toned warnings |

### Confidence
| Token | Colour |
|---|---|
| `Confidence.High` | Green `#4ade80` |
| `Confidence.Medium` | Yellow `#facc15` |
| `Confidence.Low` | Red `#f87171` |

### Quality (Timeline)
`Quality.Excellent` · `Quality.Good` · `Quality.Moderate` · `Quality['Low energy']`

## Typography (`src/styles/tokens/typography.js`)

### FontSize Scale
| Name | Size | Use |
|---|---|---|
| Display | 28 | Hero numbers (best window) |
| Heading1 | 22 | Major section headings |
| Heading2 | 18 | Modal titles, card groups |
| Heading3 | 16 | Sub-headings |
| CardTitle | 13 | Card primary text |
| Body | 13 | Body copy |
| BodySmall | 12 | Secondary body |
| Caption | 11 | Labels, metadata |
| Label | 10 | ALL CAPS section labels |
| Badge | 10 | Badges, tags |

### TextStyle (pre-built)
Use `TextStyle.CardTitle`, `TextStyle.Body`, etc. for consistent application.

## Spacing (`src/styles/tokens/spacing.js`)

| Token | Value |
|---|---|
| `Space.xs` | 4px |
| `Space.sm` | 8px |
| `Space.md` | 12px |
| `Space.lg` | 14px |
| `Space.xl` | 16px |
| `Space['2xl']` | 20px |
| `Space['3xl']` | 24px |

Card padding: `Pad.card = '12px 14px'`
Card gap: `Gap.card = 8px`

## Radius (`src/styles/tokens/radius.js`)

| Token | Value | Use |
|---|---|---|
| `Radius.card` | 14 | All cards |
| `Radius.button` | 10 | All buttons |
| `Radius.badge` | 20 | Badges, pills |
| `Radius['2xl']` | 16 | Hero cards |
| `Radius.modal` | `'20px 20px 0 0'` | Bottom sheets |
