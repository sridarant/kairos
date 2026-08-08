# Known Limitations

## Horizon Fetch in Planner

`PlannerScreen` calls `/api/daily` directly for each future day in the 7/14-day horizon.
These raw API responses use snake_case fields (`golden_window`, `avoid_window`) because
they bypass the adapter layer. This is a documented exception: PlannerScreen uses these
fields internally only and does not pass them to child components.

**Planned fix (v31):** Add a `PlannerHorizonAdapter` so all data is normalised before use.

## Ephemeris Precision

The ephemeris is accurate to ±1° for major planets within 2026–2030.
For higher precision, replace `lib/astronomy/ephemeris.js` with Swiss Ephemeris.

## Birth Time Default

Without exact birth time, Lagna (ascendant) defaults to sunrise (~06:00).
Recommendations are most accurate with birth time within 15 minutes.

## Family Alignment Scoring

Family alignment uses a simplified scoring model. It reflects general directional harmony,
not a precise compatibility measurement.

## Weekly Plan Caching

The week plan regenerates on every API call. A caching layer would improve performance.

## Offline Support

The PWA service worker precaches static assets. `/api/daily` requires a network connection.
Offline mode shows the loading state indefinitely.

## Recommendation Differentiation

On days with uniform strong or weak planetary support, multiple categories may display
similar star ratings. The capping mechanism (category stars ≤ overall day stars + 1)
prevents misleading 5-star labels on 2-star days, but does not guarantee differentiation
when the reasoning engine legitimately assigns the same quality to all categories.
