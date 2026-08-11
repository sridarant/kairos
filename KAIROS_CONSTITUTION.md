# KAIROS CONSTITUTION

## Status

This document is binding for all future Kairos implementation work.

## 1. Preserve correctness before presentation

Do not knowingly break: - calculation correctness - data integrity -
database contracts - API contracts - persisted user data -
authentication/security - core business semantics

Presentation changes are allowed when explicitly authorised by the
current sprint.

## 2. Presentation IA changes are explicitly allowed

The Minimalist UI programme explicitly authorises changes to: -
information architecture - navigation presentation - page composition -
card structure - theme - layout - responsive behaviour - interaction
patterns

These changes must not silently alter business meaning or calculation
results.

## 3. Inspect before modifying

Never infer architecture from screenshots or documentation when source
code is available.

Every defect must be classified: - VERIFIED --- directly supported by
code/runtime/test evidence - INFERRED --- strongly supported but not
directly established - SUSPECTED --- requires investigation - PRODUCT
RECOMMENDATION --- proposed improvement, not an existing defect

## 4. One source of truth

Business calculations must have one canonical implementation.

If multiple implementations exist: - identify them - classify them -
migrate production usage - remove/deprecate obsolete paths deliberately

## 5. No business logic in React

React may: - render - manage UI state - invoke application actions

React must not calculate: - scores - rankings - best dates - best
windows - domain suitability - family compatibility - recommendations

## 6. Layer boundaries

Preferred direction:

Astronomy → Astrology → Reasoning → Decision → Recommendations → Daily
Brief → Adapters → Bootstrap → React

Lower layers must not import higher-level application layers.

## 7. Canonical metrics must remain distinct

Never use one metric to represent another.

At minimum distinguish: - suitability - confidence - priority -
time-window score

A confidence score must never be presented as a suitability score.

## 8. No fake personalisation

Do not claim personalisation unless the actual calculation uses the
relevant profile data.

Birthplace/timezone shown in Profile must be part of the calculation if
the product claims they matter.

## 9. No silent defaults for missing critical data

Missing: - birth date - birth time - birth location - timezone

must be represented explicitly.

Fallback calculations must be distinguishable from personalised
calculations.

## 10. No hardcoded production results

Do not hardcode: - dates - windows - scores - recommendations -
confidence - family outcomes

Test fixtures are permitted.

## 11. Explainability

Every important recommendation should have structured reason
codes/evidence.

The UI may simplify the explanation, but must not invent one.

## 12. Version calculations

Calculation outputs must be traceable to: - calculation version -
generated timestamp - profile ID - target date - calculation timezone

## 13. Claude is language-only unless explicitly authorised otherwise

Claude may transform structured engine output into prose.

Claude must not independently determine: - DO/WAIT/AVOID - suitability
scores - confidence - timing - category rankings

Any legacy path that violates this rule must be isolated or removed.

## 14. Medical safety

Kairos must never advise delaying necessary medical treatment.

Kairos timing guidance is supplementary and must not replace clinical
advice.

## 15. Financial safety

Kairos may provide reflective/timing guidance.

It must not imply guaranteed financial outcomes or regulated financial
advice.

## 16. Defensive programming

All external/async operations must: - validate input - handle failure -
return safe structured errors - avoid crashing the UI

No unhandled promise rejections.

## 17. DTO boundary

All engine/API data consumed by React must pass through the canonical
adapter/DTO boundary.

Exceptions require explicit architecture documentation and must not
become permanent shortcuts.

## 18. Minimalism is a product requirement

Before adding any UI element ask: 1. Is this needed now? 2. Does it help
a decision? 3. Is it duplicated? 4. Can it be simpler? 5. Can it be
progressively disclosed? 6. Can it be removed?

Prefer removal over addition.

## 19. Light-first design

The current dark theme is not sacred.

Kairos should move toward: - light-first - calm - restrained -
spacious - low visual noise - minimal cards - minimal colour - minimal
badges - minimal emoji/icon noise

## 20. Release discipline

Never declare a sprint complete unless: - build passes - tests pass -
deployment succeeds - deployed smoke tests pass - no critical console
errors - no critical API errors - cross-screen consistency tests pass

## 21. Evidence over confidence

Never say "fixed" unless verified.

Use: - PASS - FAIL - BLOCKED - NOT VERIFIED

with evidence.

## 22. No unsolicited feature expansion

A sprint must stay within its stated scope.

If a useful unrelated improvement is discovered: - document it - add it
to technical debt/backlog - do not implement it unless authorised.
