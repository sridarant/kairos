# KAIROS --- RELEASE CHECKLIST

## Calculation

-   [ ] Overall suitability is separate from confidence
-   [ ] Domain scores derive from canonical domain model
-   [ ] Time windows derive from canonical time model
-   [ ] Weekly best/challenging rankings use suitability
-   [ ] Future calculations use the actual profile
-   [ ] Planner activity type affects ranking
-   [ ] Family overlap uses actual member windows
-   [ ] Birth location/timezone handling is explicit
-   [ ] Calculation version recorded

## Data

-   [ ] No profile fields silently dropped
-   [ ] No hidden default birth data for personalised users
-   [ ] No silent fallback presented as personalised
-   [ ] API/DTO contracts validated

## Architecture

-   [ ] No duplicate production calculation paths
-   [ ] No React business scoring
-   [ ] No lower-layer import from `src`
-   [ ] Planner uses adapter boundary
-   [ ] Legacy `api/ask.js` path isolated or removed

## UI

-   [ ] Light-first minimalist design
-   [ ] No unnecessary cards
-   [ ] No duplicated information
-   [ ] One primary recommendation
-   [ ] One primary best window
-   [ ] One primary caution
-   [ ] Progressive disclosure for secondary data
-   [ ] No duplicate Tomorrow on desktop
-   [ ] No unnecessary nested scroll areas
-   [ ] Responsive mobile/tablet/desktop

## Design system

-   [ ] One colour/theme source of truth
-   [ ] No raw hex in components
-   [ ] No duplicate token systems
-   [ ] Contrast verified
-   [ ] Touch targets \>=44px
-   [ ] Keyboard navigation verified

## Tests

-   [ ] Engine tests pass
-   [ ] Adapter tests pass
-   [ ] Cross-screen consistency tests pass
-   [ ] Profile/date/timezone tests pass
-   [ ] Planner tests pass
-   [ ] Family overlap tests pass
-   [ ] Regression tests for every fixed P0 issue

## Build/deploy

-   [ ] npm install/ci succeeds
-   [ ] npm run build succeeds
-   [ ] no critical build warnings
-   [ ] deployed smoke test succeeds
-   [ ] production console clean
-   [ ] production API errors absent

## Documentation

-   [ ] version source is consistent
-   [ ] architecture updated
-   [ ] data contract updated
-   [ ] known limitations updated
-   [ ] changelog updated
