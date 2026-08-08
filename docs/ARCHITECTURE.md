# Kairos Architecture

## Overview

Kairos is a 10-layer Vedic astrology life planning companion. Data flows strictly downward — no layer imports from a layer above it. Each layer has a single responsibility and a defined public API.

## Layer Stack

```
Layer 1: Astronomy          lib/astronomy/        Sidereal calculations, Lahiri ayanamsa
Layer 2: Astrology          lib/astrology/        Panchang, dashas, yogas, context building
Layer 3: Reasoning          lib/reasoning/        Evidence graph, conflict resolution
Layer 4: Decision           lib/decision/         DO/WAIT/AVOID, confidence, timeline
Layer 5: Recommendations    lib/recommendations/  Ranked recommendation packages
Layer 6: Daily Brief        lib/dailyBrief/       Morning brief synthesis
Layer 7: Adapters           lib/adapters/         snake_case → camelCase, DTO validation
Layer 8: Bootstrap          src/app/bootstrap/    App startup, API orchestration
Layer 9: React State        src/hooks/            useBootstrap — single state surface
Layer 10: Presentation      src/components/       Pure rendering, no business logic
```

## Data Flow

```
POST /api/daily
  → getDailyAstronomy()                lib/astronomy
  → buildAstroContext()                lib/astrology
  → runFullReasoning()                 lib/reasoning
  → buildDecisionObject()              lib/decision
  → buildMember() / buildFamilyDecisionObject()  api/daily.js (assembly only)

Client (on load, sync):
  identityManager.load()               src/identity
  → fetchDailyAPI(users)               src/app/bootstrap
  → buildApplicationDTOs()             src/app/bootstrap
      → buildDailyPackages()           lib/recommendations
      → rankRecommendations()          lib/recommendations
      → buildMorningBrief()            lib/dailyBrief
      → buildWeeklyPlan()              lib/recommendations
      → adaptRecommendations()         lib/adapters  ← camelCase boundary
      → adaptDailyBrief()              lib/adapters
      → adaptTimeline()                lib/adapters
      → adaptWeeklyPlan()              lib/adapters
      → adaptMembers()                 lib/adapters
  → useBootstrap() state               src/hooks
  → AppShell → Shell → Screen          src/layout, src/components
```

## Key Architectural Decisions

See `docs/architecture/` for full ADRs.

**ADR-001:** Layered architecture — data flows down, never up  
**ADR-002:** BootstrapManager owns all API calls — hooks own only React state  
**ADR-003:** Adapter layer is the only place snake_case → camelCase conversion occurs  

## Identity Architecture

User identity is stored in `localStorage` under key `kairos_identity_v1`.  
All reads and writes go through `IdentityManager` (singleton) → `IdentityRepository`.  
No component or hook accesses `localStorage` directly.

Schema versioning in `IdentityManager.js` handles forward/backward compatibility.

## Adaptive Layout

Three shells driven by `useLayout()` detecting viewport width:
- `< 768px` → `MobileShell` (bottom nav, single column)
- `768–1199px` → `TabletShell` (sidebar nav, single main column)
- `≥ 1200px` → `DesktopShell` (sidebar + main + context panel)

Each tab is a **true primary route** — only one screen renders at a time.

## Design System

All visual tokens in `src/styles/tokens/`. All reusable components in `src/design-system/components/`. Screens import via `src/components/common/index.jsx`.

No raw hex values in component files. No magic spacing numbers. All from tokens.

**Frozen after v30:** No new visual patterns without updating the Design System.
