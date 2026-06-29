# Pandora Pruning Review

## Purpose

Keep stale-memory pruning review-first, explainable, and non-destructive until explicitly approved.

## Rules

- Pruning recommendations are not deletion approvals.
- Default mode is review-only.
- Never hard-delete memory automatically.
- Never archive, supersede, or apply pruning without explicit human approval.
- High-confidence durable memories are protected.
- Unsafe candidates require immediate review but still should not expose raw secret values.

## Candidate categories

- `stale`: outdated operational status.
- `superseded`: newer verified memory replaces older memory.
- `low_value`: low usefulness and rarely retrieved.
- `unsafe`: secret-like or sensitive content should not be retained as-is.
- `duplicate`: same meaning as a stronger memory.

## Dry-run review checklist

For each proposed candidate, require:

- memory id or safe reference
- namespace
- category
- recommendation
- reason
- retrieval weight
- superseding memory if applicable
- proposed action

## Completion standard

Return `safe_to_keep_review_only`, `needs_score_tuning`, or `unsafe_to_apply`, and do not approve real pruning unless the user explicitly asks after review.
