# ADR-003: DTO Layer

**Date:** 2026-08-05  **Status:** Accepted

## Context
Engine modules and React components used different field names for the same data (bestTime vs best_time, etc.), causing silent rendering failures.

## Decision
Define canonical DTOs in lib/dto/index.js. All adapters must produce objects matching these definitions. React only consumes DTOs.

## Consequences
- Field name bugs are caught at the adapter layer
- DEV diagnostics panel shows exactly which DTO fields are missing
- Adding new engine data requires only an adapter change, not a component change
