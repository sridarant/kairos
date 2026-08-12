# Known Limitations

*Last updated: v30.10.2*

## Ephemeris Precision

The ephemeris uses mean-motion approximations (VSOP87-derived). Accuracy is ±1° for major planets within 2026–2030. For higher precision, replace `lib/astronomy/ephemeris.js` with Swiss Ephemeris.

## Lagna Calculation

`computeLagna()` in `lib/astronomy/ephemeris.js` uses a simplified RAMC formula. Longitude is now correctly applied (P0-1 fix), and UTC conversion is correct (P0-2 fix). However, the underlying formula is not as precise as dedicated ascendant software. Sign boundaries near the horizon may differ by ±1° from traditional calculations.

## Birth Time Accuracy

Without exact birth time, Lagna (ascendant) defaults to local sunrise (~06:00). Recommendations are most accurate with birth time within 15 minutes. The `birthTimeAccuracy` field in the identity model accepts `'exact'|'approximate'|'unknown'` but is not yet surfaced in the UI calculation confidence indicator.

## Location Resolution

`resolveBirthLocation()` uses a fixed list of ~35 known cities. Cities not in the list return `UNRESOLVED` status and use the default 20°N/78°E (India approximate). A geocoding API integration would resolve this. The location status (`approximate`/`unresolved`) is included in every API `_meta` response.

## Family Harmony Model

`buildFamilyDecisionObject()` computes harmony from slot-level intersection (P0-7 fix). However, the **harmony score** itself (`harmonyScore` in the response) is still derived from averaging individual suitability scores, not a genuine astrological compatibility model. The `overlapType`/`explanation` fields are accurate; the `harmonyScore` numerical value is an approximation.

## Weekly Plan Caching

The week plan regenerates on every `/api/daily` call. A Redis or edge-cache layer would improve performance for repeated same-day requests.

## Offline Mode

The PWA service worker precaches static assets. `/api/daily` requires a network connection. Offline mode shows the loading state indefinitely. No offline fallback calculation is available.

## Domain Star Cap Removed (P0-6)

Domain stars (per recommendation category) are no longer capped by the overall day suitability. Finance on a Moderate day may show 4★ because finance uses the risk dimension, not the overall composite. This is correct behaviour — the `domains.finance.isException` and `exceptionReason` fields explain the divergence. However the UI does not yet visually distinguish domain exceptions.

## PlannerHorizonAdapter — scoredSlots Size

The Planner fetches up to 14 future days individually, each returning full `scoredSlots` (6 entries × 4 dims). This is ~84 slot objects per request sequence. Serialization is efficient but could be further optimised by returning only the canonical windows rather than raw slots.

## Dasha Calculation Limitation

Vimshottari Dasha is calculated from the Moon's position at birth. Without a precise birth time, the Moon's nakshatra boundary can shift. For births near a nakshatra boundary (Moon at 13° of its 13.33° span), the current dasha lord may be incorrect by one period.

## Supabase (Optional Persistence)

Supabase is optional. When configured, `api/data.js` uses table `user_data`. The commented schema in `api/supabase.js` describes a multi-table design (`kairos_users`, `kairos_history`, etc.) that does not match the live `user_data` table. The RLS documentation contains a permissive example policy; production deployments must replace it with user-scoped policies.
