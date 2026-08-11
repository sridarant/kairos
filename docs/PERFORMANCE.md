# Performance

## Bundle Size (v30.7)

| Asset | Size (gzip) |
|---|---|
| JS (index.js) | ~73KB |
| CSS | ~0.8KB |
| Service worker | ~8KB |
| Total precache | ~215KB |

## React Rendering

**Memoized components:**
- `TimelineSection` — memo (expensive render, pure)
- `ThisWeekSection` — memo (pure, only re-renders on new weeklyPlan)
- `TomorrowSection` — memo (pure, only re-renders on new brief)

**Stable actions** — all `useBootstrap` actions use `useCallback([])`. No re-creation on re-render.

**Derived state** — all derived values use `useMemo`. `dateContext`, `dtos`, `allUsers`, `primaryUser`, `feedbackHist` only recompute when their dependencies change.

**No duplicate renders** — each tab renders exactly one primary screen. HomeScreen is unmounted when switching to Planner, Family, or Insights.

## Synchronous Bootstrap

`initialiseApp()` runs at module import time (before React mounts). Identity is loaded synchronously from localStorage. The first render has the correct `profileStatus` — no flash, no loading indicator for identity.

## API Call Frequency

- `/api/daily` called once on mount, once per tab change to Today, once per future-day navigation
- No polling
- No background refresh
- PlannerScreen makes up to 14 sequential calls for horizon view (user-triggered)

## Expensive Operations

| Operation | Where | Cost |
|---|---|---|
| `buildDecisionObject` | `/api/daily` (server) | ~5ms |
| `runFullReasoning` | `/api/daily` (server) | ~3ms |
| `adaptMembers` | `buildApplicationDTOs` | O(n) trivial |
| `buildDateContext` | `useMemo` on daysAhead | trivial |
| `computeFeedbackPrefs` | `useMemo` on feedbackHist | O(n) linear |

No client-side astronomical calculations. All computation is server-side.

## Recommendations

- Add Redis caching for `/api/daily` responses (same user + same date = same result)
- Consider lazy-loading PlannerScreen (it fetches horizon data on mount)
- Consider `React.lazy()` for PlannerScreen and FamilyScreen
