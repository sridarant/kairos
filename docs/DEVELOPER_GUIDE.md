# Developer Guide

## Overview

Kairos is a 10-layer system. Understanding the layers is the most important thing.
Data always flows downward — no layer imports from a layer above it.

## Project Structure

```
api/                  Vercel serverless functions
  daily.js            Main endpoint: POST /api/daily
  data.js             Persistence: GET/POST /api/data

lib/                  All business logic (no React)
  astronomy/          Layer 1: Pure astronomical calculations
  astrology/          Layer 2: Vedic interpretation
  reasoning/          Layer 3: Evidence graph
  decision/           Layer 4: Decision engine
  recommendations/    Layer 5: Recommendation service
  dailyBrief/         Layer 6: Brief synthesis
  adapters/           Layer 7: DTO normalisation
  dto/                DTO type definitions (JSDoc)
  tests/              engine.test.js, adapters.test.js

src/
  app/bootstrap/      Layer 8: BootstrapManager.js
  hooks/              Layer 9: useBootstrap.js
  constants/          Shared constants (icons, tabs, async states)
  styles/tokens/      Design tokens (frozen after v29)
  design-system/      Component library
  components/         React components (presentation only)
    common/           Bridge re-exports from design-system
    cards/            Recommendation card
    pages/today/      8 home screen sections
    [modal].jsx       Modal overlays

docs/                 All documentation
public/               Static assets, PWA manifest, service worker
```

## First-time Setup

1. `npm install`
2. `cp .env.example .env` — fill in keys (all optional)
3. `npm run dev` — starts Vite dev server on :5173, Vercel dev on :3000
4. Open http://localhost:5173

## Adding a New Screen

1. Create `src/components/pages/[screen]/[Screen]Section.jsx`
2. Import from `src/components/common/index.jsx` for all UI primitives
3. Import tokens from `src/styles/tokens/index.js` for all style values
4. Add the screen to `src/App.jsx` as a modal or route
5. Pass DTOs from `useBootstrap()` — never raw engine data

## Data Flow (one-way, no skipping)

```
POST /api/daily
  → getDailyAstronomy()        lib/astronomy
  → buildAstroContext()        lib/astrology
  → runFullReasoning()         lib/reasoning
  → buildDecisionObject()      lib/decision
  → buildMember()              api/daily.js (assembly only)

Client:
  fetchDailyAPI()              BootstrapManager
  → buildDailyPackages()       lib/recommendations
  → buildMorningBrief()        lib/dailyBrief
  → buildWeeklyPlan()          lib/recommendations
  → adaptRecommendations()     lib/adapters
  → adaptDailyBrief()          lib/adapters
  → adaptTimeline()            lib/adapters
  → adaptWeeklyPlan()          lib/adapters
  → useBootstrap() state       src/hooks
  → HomeScreen props           src/components
```

## Rules (enforced by architecture)

- No React component imports from `lib/decision`, `lib/astrology`, or `lib/astronomy`
- No snake_case property names in any `src/` file
- All style values come from `src/styles/tokens/index.js`
- All UI components come from `src/components/common/index.jsx`
- No business logic in React components or hooks
- BootstrapManager owns all API calls
- useBootstrap owns all React state

## Running Tests

```bash
node lib/tests/engine.test.js    # Layer 1-4 correctness
node lib/tests/adapters.test.js  # Layer 7 adapters + DTO validation
```

Both use plain Node — no test framework dependency.
