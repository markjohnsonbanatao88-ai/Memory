# Pandora PR Review

## Purpose

Review Pandora pull requests for safety, correctness, rollout impact, and evidence before merge.

## Review checklist

- What changed?
- Which files changed?
- Any env vars added or changed?
- Any migration added?
- Any public route added?
- Any protected route changed?
- Any memory write, prune, delete, archive, or scoring behavior changed?
- Any namespace isolation risk?
- Any secret handling risk?
- Are tests sufficient?
- Are post-merge steps clear?

## Merge recommendation format

Return one of:

- `safe_to_merge`
- `needs_fix_before_merge`
- `blocked_by_missing_evidence`
- `do_not_merge`

Include exact reasons.

## Forbidden

- Do not merge your own risky PR without review.
- Do not ignore CodeRabbit or CI failures.
- Do not approve production mutation hidden inside a PR.

## Completion standard

Report PR URL, state, CI status, changed files summary, migration safety, env impact, risk level, merge recommendation, and post-merge steps.
