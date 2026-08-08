# Engineering Standards

All contributors must follow these standards. Future AI assistants extending Kairos must follow them.

## Naming Conventions

| Context | Convention | Example |
|---|---|---|
| JS modules | camelCase | `weeklyPlanner.js` |
| React components | PascalCase | `HomeScreen.jsx` |
| DTO fields (src/) | camelCase | `bestWindow`, `goldenWindow`, `daysAhead` |
| API response fields | snake_case | `golden_window`, `days_ahead` (adapter normalises) |
| Constants | UPPER_SNAKE | `CAT_ICON`, `ASYNC_STATE` |
| CSS classes | kebab-case | `fade-in`, `slide-up` |

**Rule:** No snake_case reaches any `src/` file. The adapter boundary is `lib/adapters/`.

## Folder Conventions

```
api/          Vercel serverless handlers. No business logic.
lib/          All engine logic. No React. No localStorage.
src/
  identity/   Identity persistence only. No UI.
  app/        BootstrapManager, config. No UI.
  hooks/      React state only. No business logic.
  layout/     Shell components only. Route → screen mapping.
  components/ Pure rendering. No direct API calls. No storage.
  styles/     Design tokens only.
  lib/        Pure utilities (utils.js, nanoid.js). No side effects.
docs/         Documentation only.
```

## Component Conventions

- **Props must be validated DTOs** — never raw engine objects
- **No `useState` for server data** — use `useBootstrap()` DTOs
- **No inline business logic** — call actions from `useBootstrap()`
- **All styles from tokens** — `src/styles/tokens/index.js`
- **All UI primitives from Design System** — `src/components/common/index.jsx`
- **No hardcoded colors or spacing**

## Adapter Conventions

- One adapter per DTO type (Recommendation, DailyBrief, Timeline, WeeklyPlan, Member)
- Every adapter handles: camelCase normalisation, defaults, clamps, type guards
- Every adapter has tests in `lib/tests/adapters.test.js`
- Null inputs return null (not throw)

## Hook Conventions

- `useBootstrap()` is the only hook that fetches data
- No hook may call `fetch()` or access `localStorage` directly
- Derived state via `useMemo`, actions via `useCallback`
- Identity changes propagated via `identityManager.subscribe()`

## Error Handling

- Every `async` function has `try/catch`
- API routes return `{ error, code }` for all errors
- No silent failures — every catch must log or surface to user
- Server logs internal details; client receives safe messages

## Testing Standards

- Test file: `lib/tests/adapters.test.js` (62+ tests), `lib/tests/engine.test.js` (23+ tests)
- Run before every commit: `node lib/tests/engine.test.js && node lib/tests/adapters.test.js`
- Every production bug gets a regression test labelled `REGRESSION:`
- Test edge cases: null inputs, invalid types, boundary values, empty arrays

## Documentation Standards

- Every module has a top-of-file JSDoc comment
- Every major function has a one-line description
- ADRs in `docs/architecture/` for every architectural decision
- `KNOWN_LIMITATIONS.md` updated when limitations are discovered

## Security Standards

- No API keys or secrets in `src/` (client bundle)
- All API inputs validated and sanitised
- User PII (name, DOB, birth time) never logged
- `userId` sanitised to alphanumeric + `-_`
- localStorage key: `kairos_identity_v1` only

## Release Checklist

See `docs/RELEASE_CHECKLIST.md`.
