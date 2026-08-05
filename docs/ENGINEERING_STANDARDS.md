# Engineering Standards

These standards are mandatory for all future contributions.

## Naming

| Context | Convention | Example |
|---|---|---|
| Files | camelCase for JS, PascalCase for JSX | `weeklyPlanner.js`, `HomeScreen.jsx` |
| Functions | camelCase verbs | `buildDailyPackages`, `adaptTimeline` |
| Constants | UPPER_SNAKE | `CAT_ICON`, `ASYNC_STATE` |
| DTO fields | camelCase | `bestWindow`, `daysAhead`, `confidenceLevel` |
| API response fields | snake_case | `golden_window`, `days_ahead` (adapter normalises) |
| CSS classes | kebab-case | `fade-in`, `slide-up` |

## Components

- Every component is presentation-only
- Props must be validated DTOs — never raw engine objects
- Import UI from `src/components/common/index.jsx`
- Import tokens from `src/styles/tokens/index.js`
- No inline hex values, no magic spacing numbers
- No `useState` for data that belongs in `useBootstrap`

## Adapters

- One adapter per DTO type
- Adapters handle ALL normalisation (snake_case, defaults, clamps)
- No adapter imports from React
- Every adapter has corresponding tests in `lib/tests/adapters.test.js`

## API Routes

- Validate all inputs before processing
- Return `{ error, code }` for all errors
- Never expose raw engine errors to client
- Never log user names, DOBs, or birth times

## Tests

- Tests use plain Node — no test framework
- Every adapter has tests for: normal input, snake_case input, null input, invalid values
- Every production bug gets a regression test labelled `REGRESSION:`
- Run before every commit: `node lib/tests/engine.test.js && node lib/tests/adapters.test.js`

## Design System

- All design values from `src/styles/tokens/index.js` — no raw values
- All reusable components from `src/design-system/components/index.jsx`
- No new visual patterns without first adding to the Design System
- TypeScript is NOT used — JSDoc provides type documentation

## Error Handling

- Every async function has try/catch/finally
- Loading state is always cleared in `finally`
- Client shows friendly error; server logs technical detail
- No swallowed exceptions, no silent failures

## Documentation

- Every module has a top-of-file comment describing: purpose, inputs, outputs, rules
- ADRs in `docs/architecture/` for every major architectural decision
- `docs/KNOWN_LIMITATIONS.md` documents any known issues

## Release Checklist

See `docs/RELEASE_CHECKLIST.md` — run before every release.
