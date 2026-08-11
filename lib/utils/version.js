/**
 * /lib/utils/version.js — Single source of truth for all version strings.
 *
 * Sprint 3 — Item 8: Version consolidation.
 *
 * POLICY:
 *   RELEASE_VERSION  — Human-facing UI/product release (matches public/version.json).
 *                      Changed when product behaviour or UI changes.
 *   CALC_VERSION     — Algorithm version (in lib/models/DailyInsight.js).
 *                      Changed only when calculation logic changes.
 *   SCHEMA_VERSION   — Identity storage schema (in IdentityRepository.js).
 *                      Changed only when the stored identity shape changes.
 *
 * DO NOT change RELEASE_VERSION here without also updating public/version.json.
 * DO NOT use this in package.json (npm convention requires 1.0.0 or similar).
 *
 * The IdentityManager.export() _exportVersion was previously stale (30.3.2).
 * It now reads from here so it stays in sync.
 */

export const RELEASE_VERSION = '30.10.0'
export const CALC_VERSION    = '2.0'   // re-exported from DailyInsight.js
export const SCHEMA_VERSION  = 1       // identity localStorage schema version
