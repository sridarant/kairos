# ADR-002: Bootstrap Manager

**Date:** 2026-08-05  **Status:** Accepted

## Context
App.jsx accumulated startup logic, API calls, adapter invocations, and state management. It was difficult to test and maintain.

## Decision
Create BootstrapManager.js as the single owner of application startup. It exposes pure functions that App can call, and a useBootstrap() hook wraps it for React.

## Consequences
- App.jsx is < 70 lines
- Startup logic is unit-testable without React
- Adapter pipeline runs in one place
