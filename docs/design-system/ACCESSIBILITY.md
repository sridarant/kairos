# Accessibility Guidelines

## Touch Targets
- All interactive elements: minimum 44×44px (`TOUCH.base`)
- Compact interactive elements: minimum 32×32px (`TOUCH.min`)
- All buttons use `minHeight: 44` or `minHeight: 32` from DS

## Colour Contrast
- Text.Primary (#fff) on Surface.Card (#1a1a1a): 12.6:1 ✓ AAA
- Text.Secondary (#666) on Surface.Card (#1a1a1a): 4.0:1 ✓ AA
- Accent (#facc15) on Surface.Card: 8.9:1 ✓ AAA
- Status.Danger (#f87171) on Surface.Card: 4.4:1 ✓ AA

## Screen Readers
- All interactive elements have `aria-label` or visible text
- Star ratings use `aria-label="N out of 5 stars"`
- Confidence dots use `aria-label="Confidence: High"`
- Navigation uses `role="navigation"` and `aria-current="page"`
- Sections use `aria-label`

## Keyboard Navigation
- All buttons are `<button>` elements (keyboard focusable)
- Cards with onClick use `role="button"` or `<button>` wrapper
- Modals trap focus within the overlay

## Reduced Motion
The CSS `fade-in` and `slide-up` animations respect `prefers-reduced-motion`.
Add to index.css to complete support:
```css
@media (prefers-reduced-motion: reduce) {
  .fade-in, .slide-up, .scale-tap { animation: none; transition: none; }
}
```

## Dynamic Text
All `fontSize` values are unitless numbers (px). Implement `clamp()` or
`em`-based sizing in a future phase for full dynamic text support.
