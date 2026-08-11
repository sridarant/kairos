# Bootstrap Architecture

## Overview

The bootstrap sequence loads identity synchronously before the first React render, preventing any flash of "Demo Mode" for returning users.

## Sequence

```
Module import time (synchronous, before React):
  const _init = initialiseApp()
    → identityManager.load()     reads kairos_identity_v1 from localStorage
    → identityManager.trackOpen() increments session count
    → returns { identity, users, profileStatus }

First render:
  useState(_init.identity)       → correct identity from frame 1
  useState(_init.profileStatus)  → 'personalised' not 'demo' for returning users

useEffect (after first render):
  fetchDailyAPI(users, daysAhead)  → network call
  → setDaily(raw)
  → setStatus(SUCCESS)
```

## State Ownership

| State | Owner | Never in |
|---|---|---|
| Identity (profile, family) | `IdentityManager` (singleton) | React state |
| API response (daily, members) | `useBootstrap` via `useState` | localStorage |
| Derived DTOs | `useBootstrap` via `useMemo` | API or storage |
| Tab/route | `useBootstrap` via `useState(TABS.TODAY)` | URL |
| Modal open/close | `useBootstrap` via `useState(false)` | URL |

## BootstrapManager Responsibilities

`src/app/bootstrap/BootstrapManager.js`:

- `initialiseApp()` — synchronous startup, reads identity
- `fetchDailyAPI(users, daysAhead)` — the single API caller
- `buildApplicationDTOs(daily, feedbackHistory)` — runs all 5 adapters
- `buildDateContext(daysAhead)` — date/time display labels

## useBootstrap Responsibilities

`src/hooks/useBootstrap.js`:

- Holds all React state
- Subscribes to `identityManager` for identity changes
- Exposes actions (`handleSaveProfile`, `handleFeedback`, etc.)
- Exposes `setTab` directly (no routing abstraction)
- Never calls fetch, never accesses localStorage

## Identity Change Propagation

```
ProfileModal.save()
  → bs.handleSaveProfile(fields, family)
    → identityManager.saveProfile(fields, family)
      → _repo.save(identity)         writes to localStorage
      → this._notify()               calls all subscribers
        → useBootstrap subscriber    setIdentity / setProfileStatus
          → React re-render          DemoBanner disappears
```

## Failure Modes

| Failure | Behaviour |
|---|---|
| localStorage blocked | `MemoryProvider` used — identity lost on refresh |
| `/api/daily` fails | `status = ERROR`, ErrorState shown |
| Identity corrupt | `migrateSchema` attempts repair, falls back to `newIdentity()` |
| Old schema (`kairos_users` key) | `migrateSchema` converts to v1 schema |
