# Known Limitations

## Astronomical Precision

The ephemeris uses a simplified planetary model accurate to ±1° for the major planets within 2026–2030.
For higher precision, replace `lib/astronomy/ephemeris.js` with Swiss Ephemeris (requires a C extension).

## Birth Time Precision

Without exact birth time, Lagna (ascendant) defaults to sunrise (~06:00).
Recommendations are most accurate with birth time to within 15 minutes.

## Family Alignment

Family alignment uses a simplified scoring model. It is most useful as a directional guide, not a precise compatibility measurement.

## Weekly Plan

The week plan is generated server-side for 7 days from today.
It does not persist and regenerates on each API call.
A caching layer (e.g. Supabase + Redis) would improve performance for returning users.

## Offline Support

The PWA service worker precaches static assets.
The `/api/daily` endpoint requires a network connection.
Offline mode shows the last cached state (if any) but cannot generate fresh guidance.

## Monthly View

A monthly planner is not yet implemented. The week plan covers 7 days.
See ROADMAP.md for planned v30 features.

## Language Enrichment

`/api/explain.js` uses Claude to enrich recommendation language.
It is not called by the main daily flow in v29 — the engine generates all text.
Integration planned for v30.

## TypeScript

The project uses JSDoc for type documentation but not TypeScript.
This was a deliberate decision (see ADR-003) to reduce build complexity.
Migration to TypeScript is possible without architecture changes.
