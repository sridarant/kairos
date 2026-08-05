# Kairos Design System v29.0

The Kairos Design System is a permanent, frozen foundation for all UI in Kairos.
After v29.0, no screen may introduce a new visual pattern.
New screens and features must compose from this system.

## Guiding Philosophy

**Calm · Premium · Trustworthy · Minimal · Readable · Modern · Timeless**

Every visual element serves decision-making. No decoration for its own sake.
No flashy animation. No competing visual hierarchies.

## Structure

```
src/styles/tokens/          Token definitions (source of truth)
  colors.js                 Semantic colour system
  typography.js             Type scale and pre-built styles
  spacing.js                Spacing scale + semantic aliases
  radius.js                 Border radius scale
  shadows.js                Elevation tokens
  motion.js                 Animation tokens
  zIndex.js                 Layer ordering
  breakpoints.js            Responsive breakpoints
  opacity.js                Opacity scale
  iconSizes.js              Icon size scale
  index.js                  Master re-export

src/design-system/
  tokens/index.js           Re-exports styles/tokens (for use inside DS)
  components/index.jsx      ALL reusable UI components (443 lines, frozen)

src/components/common/
  index.jsx                 Bridge re-export (use this in screens)
```

## Usage

```js
// In any component:
import { Surface, Text, Accent, Space, Radius } from '../../styles/tokens/index.js'
import { StandardCard, ConfidenceBadge, GhostButton } from '../common/index.jsx'
```

## Frozen Elements

After v29.0, these are frozen. PRs that modify them require design review:
- Typography scale (`FontSize`, `FontWeight`, `TextStyle`)
- Colour tokens (`Surface`, `Text`, `Status`, `Confidence`)
- Spacing scale (`Space`, `Pad`, `Gap`)
- Border radius (`Radius`)
- All component variants in `design-system/components/index.jsx`
