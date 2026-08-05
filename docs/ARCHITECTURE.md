# Kairos Architecture v29.0

## Layered Architecture

```
Astronomy Engine      lib/astronomy/
      ↓
Astrology Engine      lib/astrology/
      ↓
Reasoning Engine      lib/reasoning/
      ↓
Decision Engine       lib/decision/
      ↓
Planning Engine       lib/recommendations/weeklyPlanner.js
      ↓
Recommendation Svc    lib/recommendations/
      ↓
Daily Brief           lib/dailyBrief/
      ↓
Adapter Layer         lib/adapters/
      ↓
DTO Validation        lib/adapters/validate.js
      ↓
Bootstrap Manager     src/app/bootstrap/BootstrapManager.js
      ↓
useBootstrap Hook     src/hooks/useBootstrap.js
      ↓
App.jsx (shell)       src/App.jsx
      ↓
HomeScreen (compose)  src/components/HomeScreen.jsx
      ↓
Section Components    src/components/pages/today/
      ↓
Common Components     src/components/common/
```

## Rules

1. Dependencies only point downward
2. No React component imports from lib/decision or lib/astrology
3. No snake_case in React components
4. All data flows through adapters before reaching React
5. BootstrapManager owns all API calls and DTO construction
6. App.jsx is a shell only (< 70 lines)
7. HomeScreen is an orchestrator only (< 120 lines)
