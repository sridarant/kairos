# ADR-001: Layered Architecture

**Date:** 2026-08-05  **Status:** Accepted

## Context
Kairos evolved rapidly across 29 versions. Engine outputs reached React directly, causing data binding bugs and untraceable field-name mismatches.

## Decision
Adopt a strict 9-layer architecture. Each layer may only import from the layer immediately below it. No skipping layers.

## Alternatives Considered
- Monorepo with shared types: adds build complexity
- GraphQL schema: overkill for a PWA
- No formal layering: the cause of previous bugs

## Consequences
- Field name bugs become impossible (adapters enforce camelCase)
- Any layer can be swapped without changing others
- New developers can understand data flow by reading one file per layer
