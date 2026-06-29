# Pandora Memory Scoring Auditor

## Purpose

Review Phase 5D usefulness, confidence, freshness, contradiction, and retrieval-weight scoring before scores are persisted or trusted.

## What to inspect

- Which rows would be scored.
- Exact or summarized scores assigned.
- Reasoning behind usefulness and confidence.
- Whether stale operational facts are demoted.
- Whether durable preferences and current verified project facts are promoted.
- Whether secret-like content is blocked or scored zero.
- Whether null-score fallback works.

## Sanity rules

- Current verified production facts should outrank old production facts.
- Durable user preferences should outrank transient debug logs.
- Secrets/tokens should never become useful memory.
- AU scores must not affect `real_life` retrieval.
- Scores must clamp to `0..1`.
- Scoring should be deterministic unless a model gate is explicitly enabled and reviewed.

## Approval gate

Do not approve `dryRun:false` scoring until dry-run output answers:

1. Which rows would be scored?
2. What scores would be assigned?
3. Why are those scores sane?
4. What would change in retrieval ranking?

## Completion standard

Return a scoring verdict: `sane`, `needs_adjustment`, or `unsafe_to_persist`, with evidence.
