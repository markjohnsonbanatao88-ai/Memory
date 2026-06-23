# Internal approved-review memory persistence executor

This PR adds the internal executor boundary for approved-review memory persistence only. It prepares a future execution path that can consume an approved-review persistence preview plan, but execution remains disabled by default and public routes cannot persist memory.

## Safety posture

- Public production persistence is not enabled.
- `/api/memory/ingest` remains production-disabled and is not changed into a write path.
- The public approved-review persist route returns a disabled response by default.
- The executor requires an explicit internal/admin/test gate, including `PANDORA_ENABLE_APPROVED_REVIEW_MEMORY_PERSISTENCE="true"` and `x-pandora-internal-persistence-mode: approved-review-executor` or an injected admin capability.
- Client-supplied `user_id`/`userId` is rejected. The user ID must come from server auth and repository context.
- Namespace isolation is mandatory for every planned source, item, patch, audit, and review-item mark operation.

## Executor boundary

The executor uses injected repositories only. It does not instantiate Supabase, call route handlers, call model providers, perform retrieval, add embeddings, add pgvector, add GPT Actions, or add MCP. Its strict append sequence is:

1. memory source append
2. memory item append
3. memory patch append
4. audit log append
5. review item persistence mark

If any step fails, the executor returns a structured transaction-failure result and does not pretend success.

## Repository implementations

- `InMemoryApprovedReviewMemoryPersistenceRepository` exists for unit tests and internal harnesses. It stores append-only arrays and rejects namespace/user mismatch plus overwrite, delete, and update operations.
- `SupabaseApprovedReviewMemoryPersistenceRepository` is a safe skeleton only. It accepts an injected Supabase-like client but performs no live writes. A future PR must implement a transactional RPC such as `memory_execute_approved_review_persistence` behind the same internal/admin gate.

## Namespace and story/real-life boundaries

AU/story data must never become real-life evidence. Real-life memory must not enter AU unless explicitly fictionalized and reviewed. The executor preserves the approved-review namespace and evidence snapshot instead of reclassifying or broadening scope.
