# Roadmap

The platform is frozen after v30. Future releases add capabilities only.

## v31 — Intelligence Layer
- Claude-powered natural language explanations via `/api/explain`
- Push notifications for best-window alerts
- Monthly planner (top dates for career, family, finance)
- PlannerHorizonAdapter (normalise horizon fetch data)

## v32 — Social Layer
- Supabase cloud sync for identity (cross-device)
- Shared family profiles
- Family calendar export (iCal)

## v33 — Learning Layer
- Pattern recognition from feedback history
- Personalised recommendation ranking per user
- "Your patterns" in Insights tab

## Known Technical Debt (deferred)
- TypeScript migration (no architecture change required)
- Swiss Ephemeris integration for higher precision
- PlannerHorizonAdapter (see KNOWN_LIMITATIONS.md)
- Redis caching for week plan
