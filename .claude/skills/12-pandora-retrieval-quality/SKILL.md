# Pandora Retrieval Quality

## Purpose

Ensure Pandora retrieves the right memories, demotes stale or weak memories, and preserves deterministic safety gates.

## Review targets

- Hybrid retrieval service.
- Adaptive context service.
- Retrieval ranking tests.
- Namespace filters.
- Scoring fallback behavior.

## Quality checks

- Relevant current memories appear before stale memories.
- Explicit project/person matches outrank generic memories.
- Durable preferences are preserved.
- Transient debug logs are demoted unless tied to active project state.
- Null scores do not break retrieval.
- `retrieval_weight`, confidence, freshness, and feedback are used safely.
- Semantic retrieval, embeddings, and model calls remain gated unless explicitly enabled.
- AU memories never appear in `real_life` retrieval.

## Test prompts

Use representative queries for:

- current production state
- old deployment state
- user durable preference
- project-specific facts
- AU-only continuity
- contradictory facts

## Completion standard

Report retrieved order, expected order, mismatch analysis, and whether ranking is safe for production.
