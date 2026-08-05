# Release Checklist

Run before every release. All items must pass.

## Build

- [ ] `npm run build` exits 0 with no errors
- [ ] Bundle size reviewed (JS < 250KB gzip)
- [ ] Service worker precaches expected assets

## Tests

- [ ] `node lib/tests/engine.test.js` — 0 failures
- [ ] `node lib/tests/adapters.test.js` — 0 failures

## Data Pipeline

- [ ] All DTO fields are camelCase
- [ ] No snake_case reaches React components
- [ ] Adapter layer validates all DTOs before render
- [ ] No business logic in React components

## Design System

- [ ] All style values come from `src/styles/tokens/index.js`
- [ ] No raw hex values in component files
- [ ] All interactive elements have `aria-label` or visible text
- [ ] Minimum touch target 44px on interactive elements

## Responsive

- [ ] No horizontal overflow on 375px width
- [ ] No text clipping on narrow screens
- [ ] Cards wrap naturally at all widths

## Security

- [ ] No secrets in client-side code
- [ ] API routes validate all inputs
- [ ] No user PII logged to console

## Documentation

- [ ] README reflects current functionality
- [ ] `version.json` updated
- [ ] Any new ADRs written for architectural decisions
- [ ] KNOWN_LIMITATIONS updated if new limitations discovered
