# KAIROS --- VERIFIED ARCHITECTURE BASELINE

## Runtime

-   Vite 5
-   React 18
-   Vercel serverless API functions
-   Supabase optional
-   PWA / Workbox
-   JavaScript / ES modules

## Production calculation path

`api/daily.js` → `lib/astronomy/index.js` → `lib/astrology/index.js` →
`lib/decision/engine.js` → `lib/reasoning/index.js` →
`lib/reasoning/recommendationBuilder.js` → `lib/dailyBrief/index.js` →
`lib/recommendations/*` → `lib/adapters/*` →
`src/app/bootstrap/BootstrapManager.js` → `src/hooks/useBootstrap.js` →
`src/layout/*` → `src/components/*`

## Important deviations

### Legacy calculation stack

Still present: - `api/ask.js` - `api/astro.js` - `api/engine.js` -
`lib/astro/*` - `lib/decision/index.js` -
`lib/decision/recommendations.js`

Production usage must be traced before deletion.

### Reverse dependency

`lib/recommendations/recommendationBuilder.js` imports:
`src/lib/nanoid.js`

This violates the intended layer direction.

### Planner bypass

`src/components/PlannerScreen.jsx` calls `/api/daily` directly and
locally normalises response data.

This bypasses the adapter boundary.

## Identity flow

`IdentityManager` is the intended canonical identity interface.

Storage: `kairos_identity_v1`

However: - profile stores birthplace/timezone - `primaryUser` /
`allUsers` strip birthplace/timezone before API calls

This is a verified data-loss-at-boundary defect.

## Calculation location limitations

`getBirthChart()` currently accepts latitude only and defaults to 20°N.

Longitude and timezone are not used.

The Profile UI therefore collects more geographic information than the
calculation currently consumes.

## Weekly calculation

`api/daily.js`: - generates seven daily astronomy values - does not
supply the user's birth chart to future-day `buildAstroContext` -
incorrectly passes `primarySeed` as `daysAhead` - expects
`confidenceScore` from `buildDecisionObject`, but that property is
absent

## Planner

Planner: - reconstructs users with blank DOB/time - fetches future days
directly - ignores selected plan type dimensions when ranking results

These must be moved into the canonical planning layer.

## UI architecture

Desktop: `SideNav | PrimaryContent | ContextPanel`

Tablet: `SideNav | PrimaryContent`

Mobile: single screen + bottom navigation

The desktop shell currently duplicates Tomorrow information because both
HomeScreen and ContextPanel render it.
