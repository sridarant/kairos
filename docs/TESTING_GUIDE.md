# Testing Guide — v30.10.2

## Running Tests

```bash
node lib/tests/engine.test.js     # 307 tests — engine + integrations + P0 regressions
node lib/tests/adapters.test.js   # 70 tests  — adapters + DTO validation
```

**Total: 377 tests, 0 failures** as of v30.10.2.

## Test Architecture

```
lib/tests/
  engine.test.js    — engine layers 1–6, sprint regressions, invariants, integrations
  adapters.test.js  — adapter layer + DTO validation
```

## Test Sections (engine.test.js)

| Section | Count | What it covers |
|---|---|---|
| Layer 1: Astronomy | 10 | JD, planets, nakshatra, panchang |
| Layer 2: Astrology | 6 | Dignity, yogas, functional roles |
| Layer 3: Decision | 7 | Decision, stars, suitability |
| Layer 5: Recommendations | 12 | Canonical ACTIVITY_TYPES, window dims |
| Layer 6: Daily Brief | 6 | Brief fields, suitabilityTier |
| Sprint 1 P0 Regressions | 17 | P0-01 through P0-07 fixes |
| Sprint 2 P0 Correctness | 39 | P0-01 through P0-08 fixes |
| Sprint 3 Cross-Screen Invariants | 46 | INV-A through INV-I |
| Sprint 4 Activity Planning | 26 | ACTIVITY_TYPES, planActivity, family overlap |
| Hardening Sprint | 30 | Security, architecture, light theme |
| R2.1 Calculation Integrity | 40 | UTC, longitude, Dasha, Kumbakonam, family isolation |
| R2.2 Canonical Truth | 33 | DailyInsight, P0-1 through P0-10 |

## Regression Tests — P0 Coverage

Every P0 defect has a labelled regression test:

| Label | Defect | Test file |
|---|---|---|
| P0-01 | Stars from suitability, not confidence | engine.test.js: "Sprint 1 P0 Regressions" |
| P0-02 | Category stars cap in adapter | adapters.test.js |
| P0-03 | Weekly confidence not falling back to 50 | engine.test.js: "P0-03" |
| P0-04 | Weekly uses birth chart | engine.test.js |
| P0-05 | feedbackAdj not passed as userDob | engine.test.js: "P0-5" |
| P0-06 | Dasha uses targetDate | engine.test.js: "R2.1 P0-6" |
| P0-07 | Family overlap = slot intersection | engine.test.js: "Sprint 2 P0-07" |
| P0-NEW-01 | getBirthChartFromParts integer args | engine.test.js: "P0-NEW-01" |
| R2.1-P0-1 | Longitude in Lagna | engine.test.js: "R2.1 P0-1" |
| R2.1-P0-2 | UTC conversion for birth time | engine.test.js: "R2.1 P0-2" |
| R2.1-P0-3 | Kumbakonam resolves | engine.test.js: "R2.1 P0-3" |
| R2.2-P0-1 | DailyInsight validates | engine.test.js: "R2.2 P0-1" |
| R2.2-P0-5 | suitabilityTier in brief | engine.test.js: "R2.2 P0-5" |
| R2.2-P0-6 | Domain stars uncapped | engine.test.js: "R2.2 P0-6" |
| R2.2-P0-8 | Confidence ≠ suitability | engine.test.js: "R2.2 P0-8" |

## Key Invariants Tested

- `INV-A`: Today suitabilityScore = Planner same-day (determinism)
- `INV-B`: Timeline best slot = canonical window
- `INV-C`: Domain bestWindow in windows map
- `INV-D`: Finance window ≠ overall when risk dim varies
- `INV-E`: Weekly challenging = min suitabilityScore; topDay = max
- `INV-F`: dec.stars = suitabilityToStars(suitabilityScore)
- `INV-G`: PlannerHorizonAdapter preserves scoredSlots
- `INV-H`: Family overlap = slot intersection (not majority)
- `INV-I`: All 15 domains in window map

## Adding Tests

Tests use plain `assert(label, condition, got)`. No framework, no build step.

Regression test label convention: `P0-XX: description (got: value)`.
