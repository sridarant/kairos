# Kairos — Life Planning Companion

Kairos is a daily decision and life planning companion that uses Vedic astrology to help users answer **"What should I do today?"**

Built as a PWA (Progressive Web App) with React + Vite frontend and Vercel serverless API backend.

## Quick Start

```bash
npm install
# Copy .env.example to .env and add your keys
cp .env.example .env
npm run dev       # Development server
npm run build     # Production build
npm test          # Run all tests
```

## Environment Variables

```
ANTHROPIC_API_KEY=   # Optional: used by /api/explain for language enrichment
SUPABASE_URL=        # Optional: Supabase project URL for persistence
SUPABASE_ANON_KEY=   # Optional: Supabase anonymous key
```

All variables are optional — the app runs fully without them, using file-based persistence.

## Deployment

Push to GitHub. Vercel auto-deploys. Set environment variables in the Vercel dashboard.

See `docs/DEPLOYMENT.md` for full instructions.

## Architecture

```
lib/astronomy/     Layer 1: Sidereal astronomical calculations
lib/astrology/     Layer 2: Classical Vedic interpretation
lib/reasoning/     Layer 3: Evidence graph + conflict resolution
lib/decision/      Layer 4: DO/WAIT/AVOID + confidence + timeline
lib/recommendations/ Layer 5: Recommendation packages + ranking
lib/dailyBrief/    Layer 6: Morning brief synthesis
lib/adapters/      Layer 7: snake_case → camelCase, validation, DTOs
src/app/bootstrap/ Layer 8: App startup, API orchestration
src/hooks/         Layer 9: React state interface
src/components/    Layer 10: Presentation only
```

See `docs/ARCHITECTURE.md` for the full data flow.

## Testing

```bash
node lib/tests/engine.test.js    # 23 engine/astronomy tests
node lib/tests/adapters.test.js  # 62 adapter/DTO tests
```

## Documentation

- `docs/ARCHITECTURE.md` — system architecture and data flow
- `docs/DEVELOPER_GUIDE.md` — onboarding guide
- `docs/design-system/DESIGN_SYSTEM.md` — design system reference
- `docs/design-system/COMPONENT_LIBRARY.md` — component usage
- `docs/design-system/TOKENS.md` — token reference
- `docs/DEPLOYMENT.md` — deployment instructions
- `docs/ENGINEERING_STANDARDS.md` — conventions and standards
- `docs/KNOWN_LIMITATIONS.md` — known limitations and future work
