# Testing Guide

## Running Tests

```bash
node lib/tests/engine.test.js     # 23 engine tests (astronomy → decision)
node lib/tests/adapters.test.js   # 70 adapter tests (all 5 adapters + validation)
```

Both use plain Node.js — no framework, no build step, no watch mode.

## Test Structure

```
lib/tests/
  engine.test.js    Layer 1–4 correctness (astronomy, astrology, reasoning, decision)
  adapters.test.js  Layer 7 adapters + DTO validation + MemberAdapter
```

## What Is Tested

### engine.test.js (23 tests)
- Layer 1: getDailyAstronomy — returns valid panchang
- Layer 2: buildAstroContext — valid astrological context
- Layer 3: runFullReasoning — evidence graph, signals, categories
- Layer 4: buildDecisionObject — decision, confidence, stars, timeline, scoredSlots

### adapters.test.js (70 tests)
- RecommendationAdapter: normal input, snake_case, null, invalid confidence, stars capping
- TimelineAdapter: startTime/endTime, quality mapping, null filtering
- DailyBriefAdapter: all fields, tomorrow preview, REGRESSION v27 daily.why
- WeeklyPlanAdapter: categories, days, REGRESSION v27 daysAhead from days_ahead
- MemberAdapter: name required, snake→camel normalisation, invalid decision/confidence
- Validation: all validators, batch validation

## Regression Tests

Every production bug has a labelled regression test (`REGRESSION: description`):

| Label | Bug | Fixed in |
|---|---|---|
| `REGRESSION: bestWindow from best_time` | snake_case silently lost | v28 |
| `REGRESSION: description from label` | t.text didn't exist | v27 |
| `REGRESSION: summary from member not daily.why` | daily.why didn't exist | v27 |
| `REGRESSION: daysAhead from days_ahead` | week plan days not mapped | v27 |

## Adding New Tests

1. Open `lib/tests/adapters.test.js`
2. Add `assert()` calls in the relevant adapter section
3. For regressions: label as `assert('REGRESSION: what broke', ...)`
4. Run `node lib/tests/adapters.test.js` to verify

## Identity Tests

Identity lifecycle tests are in `useBootstrap.js` comments and verified manually:
- Save profile → refresh → profile persists
- Export → import → identity restored
- Delete → demo mode returns
- Old `kairos_users` key → migrated to v1 schema

See `src/identity/IdentityManager.js` for the `migrateSchema` function.
