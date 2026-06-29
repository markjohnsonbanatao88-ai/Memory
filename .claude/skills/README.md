# Pandora Agent Skills Pack

This directory contains the first serious operating skill pack for Pandora Memory.

## Core skills

1. `00-pandora-safety-gatekeeper`
2. `01-pandora-secret-redaction`
3. `02-pandora-namespace-isolation`
4. `03-pandora-protected-job-smoke-test`
5. `04-pandora-supabase-migration`
6. `05-pandora-rls-security-review`
7. `06-pandora-env-broker-drift`
8. `07-pandora-phase-rollout-operator`
9. `08-pandora-pr-review`
10. `09-pandora-ci-build-verifier`
11. `10-pandora-memory-scoring-auditor`
12. `11-pandora-pruning-review`
13. `12-pandora-retrieval-quality`
14. `13-pandora-contradiction-resolution`
15. `14-pandora-rollback`
16. `15-pandora-privacy-review`
17. `16-pandora-review-queue-ux`
18. `17-pandora-architecture-boundary`

## How agents should use these

Before any work, select the relevant skills and apply them as operating constraints. For high-risk work, always include:

- safety gatekeeper
- secret redaction
- namespace isolation
- PR review or phase rollout operator

For Phase 5D work, also include:

- memory scoring auditor
- pruning review
- retrieval quality
- contradiction resolution

For Supabase or production work, also include:

- Supabase migration
- RLS security review
- protected job smoke test
- rollback

These skills are instruction-only. They do not enable runtime behavior, deploy code, apply migrations, or mutate memory.
