# Pandora Contradiction Resolution

## Purpose

Detect and handle conflicting memories without deleting or overwriting history blindly.

## Common contradiction types

- Old deployment state vs newer deployment state.
- Old project priority vs newer project priority.
- Old relationship interpretation vs later correction.
- Old business plan vs updated strategy.
- Fictional/AU continuity vs real-life fact.

## Resolution rules

- Prefer newer verified facts over older operational facts.
- Prefer source-backed and receipt-backed memories over vague memories.
- Prefer explicit user corrections over inferred summaries.
- Mark older memory as `possibly_superseded` or create a pruning candidate; do not delete automatically.
- Keep durable preferences unless the user explicitly updates them.
- Never use AU contradictions to update real-life memory.

## Required output

For each contradiction:

- older memory reference
- newer memory reference
- conflict description
- confidence comparison
- recommended action: keep, review, supersede, or archive-candidate
- reason

## Completion standard

Return a review-first contradiction map and do not apply changes without approval.
