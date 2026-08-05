# Roadmap

The architecture is frozen after v29. Future releases add capabilities only.

## v30 — Intelligence Layer

- Claude-powered natural language explanations via `/api/explain`
- Push notifications for best window alerts
- Monthly planner (top dates for career, family, finance)
- Deeper family compatibility analysis

## v31 — Social Layer

- Shared family profiles with Supabase sync
- Family calendar export (iCal/Google Calendar)
- Shared morning brief for households

## v32 — Learning Layer

- Pattern recognition from historical feedback
- Personalised recommendation ranking per user
- "Your patterns" in Journal tab

## Technical Debt (v29 deferred)

- TypeScript migration (optional — no architecture change required)
- Swiss Ephemeris integration for higher precision
- Redis caching layer for week plan
- `/api/explain` integration into daily flow
