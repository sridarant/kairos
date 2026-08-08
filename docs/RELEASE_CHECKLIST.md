# Release Checklist

This checklist is mandatory for every release. All items must pass.

## Build
- [ ] `npm run build` exits 0 with no errors or warnings
- [ ] Bundle JS < 280KB gzip
- [ ] Service worker precaches expected assets

## Tests
- [ ] `node lib/tests/engine.test.js` — 0 failures (23+ tests)
- [ ] `node lib/tests/adapters.test.js` — 0 failures (70+ tests)

## Data Pipeline
- [ ] No snake_case in any `src/` component (run: `grep -rn "golden_window\|avoid_window\|days_ahead" src/components`)
- [ ] All DTOs flow through adapters before React
- [ ] `adaptMembers()` called for all `daily.members` before UI use
- [ ] No business logic in React components or hooks

## Design System
- [ ] All style values from `src/styles/tokens/index.js`
- [ ] No raw hex in component files (run: `grep -rn "'#[0-9a-f]" src/components`)
- [ ] All interactive elements have `aria-label` or visible text
- [ ] Minimum touch target 44px

## Identity
- [ ] Profile persists across hard refresh
- [ ] No flash of Demo Mode for personalised users
- [ ] `kairos_identity_v1` is the only localStorage key used by identity system
- [ ] `identityManager.load()` runs before first React render

## Navigation
- [ ] Each tab renders a distinct primary screen (no overlay on Today)
- [ ] Family member switcher visible immediately on Family tab
- [ ] Planner loads without showing Today content
- [ ] Back navigation works on all routes

## Responsive
- [ ] No horizontal overflow on 375px (run in browser devtools)
- [ ] Desktop three-column layout intact at 1200px+
- [ ] Timeline only appears once per viewport (not duplicated on desktop)

## Security
- [ ] No `console.log` with user data in production paths
- [ ] API inputs validated and sanitised
- [ ] No secrets in client bundle

## Accessibility
- [ ] Keyboard navigation works for all interactive elements
- [ ] `aria-current="page"` on active nav item
- [ ] Star ratings have `aria-label`
- [ ] prefers-reduced-motion respected in CSS

## Documentation
- [ ] `version.json` updated
- [ ] README reflects current functionality
- [ ] `KNOWN_LIMITATIONS.md` updated if new limitations found
