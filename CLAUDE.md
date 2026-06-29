# Claude instructions for Pandora Memory Engine

## Project

Pandora Memory Engine is a Next.js + Supabase memory system.

The product goal is to safely store, review, read back, and later retrieve structured memory across separated namespaces.

## Current phase status

- Phase 1 foundation shell: complete.
- Phase 2 first controlled live append proof: complete.
- Phase 3A receipt-backed readback console: live.
- Phase 3B database proof: verified externally.
- Phase 3B full in-app browser: not complete yet.
- Phase 5D code and migration may exist in the repo, but scoring is not complete until protected dry-run output is reviewed and a controlled non-dry-run is explicitly approved.
- Retrieval, embeddings, GPT Actions, and MCP must not be claimed as enabled unless verified by deployed route proof, database proof, or merged PR evidence.

## Pandora skills pack

Claude must use the repo skills in `.claude/skills/` as operating procedures.

Always apply these skills before risky work:

- `00-pandora-safety-gatekeeper`
- `01-pandora-secret-redaction`
- `02-pandora-namespace-isolation`

For protected jobs, migrations, production rollout, or Phase 5D work, also apply the relevant specialized skills:

- `03-pandora-protected-job-smoke-test`
- `04-pandora-supabase-migration`
- `05-pandora-rls-security-review`
- `06-pandora-env-broker-drift`
- `07-pandora-phase-rollout-operator`
- `08-pandora-pr-review`
- `09-pandora-ci-build-verifier`
- `10-pandora-memory-scoring-auditor`
- `11-pandora-pruning-review`
- `12-pandora-retrieval-quality`
- `13-pandora-contradiction-resolution`
- `14-pandora-rollback`
- `15-pandora-privacy-review`
- `16-pandora-review-queue-ux`
- `17-pandora-architecture-boundary`

The skills are documentation/instruction only. They do not enable runtime behavior, apply migrations, deploy production, or mutate memory.

## Hard safety rules

Do not enable or add any of these unless explicitly instructed and reviewed:

- public memory reads
- public memory persistence
- production ingest writes unless reviewed
- model calls
- embeddings
- semantic retrieval
- GPT Actions
- MCP
- batch memory append
- automatic memory writes without review
- `dryRun:false` protected job execution
- pruning application/archive/delete behavior

## Memory namespace rules

Keep namespaces separated.

- `real_life` is for real user, business, relationship, legal, financial, project, and personal facts.
- `au` is for fictional/AU/story continuity only.

Never mix AU/story memory into real-life evidence.
Never store real-life claims as AU unless explicitly fictionalized and reviewed.

## Persistence rules

All memory writes must be:

- reviewed
- append-only
- source-backed
- patch-backed
- audit-backed
- idempotent
- tied to server-derived or RLS-derived user identity

Do not trust client-supplied user ids.

## Auth rules

Use Supabase Auth.
Anonymous login may exist only as a temporary operator-session shortcut.
Anonymous login must not bypass memory gates.

## Secrets

Never commit secrets.
Never print or request private operator tokens in source code, logs, comments, or docs.
Use environment variables only.
Do not read `.env`, `.env.*`, `.vercel/**`, `.supabase/**`, or `secrets/**` unless the user explicitly directs local setup and confirms no secrets will be exposed in output.

Important environment gates include:

- `PANDORA_ENABLE_PERSISTED_MEMORY_READ`
- `PANDORA_ENABLE_ADMIN_PERSISTENCE_CONSOLE`
- `PANDORA_ENABLE_APPROVED_REVIEW_MEMORY_PERSISTENCE`
- `PANDORA_ENABLE_MEMORY_INGEST_PRODUCTION_WRITES`
- `PANDORA_ENABLE_PUBLIC_MEMORY_READ`
- `PANDORA_ENABLE_PUBLIC_MEMORY_PERSISTENCE`
- `PANDORA_ENABLE_MODEL_CALLS`
- `PANDORA_ENABLE_EMBEDDINGS`
- `PANDORA_ENABLE_SEMANTIC_RETRIEVAL`
- `PANDORA_ENABLE_GPT_ACTIONS`
- `PANDORA_ENABLE_MCP`
- `PANDORA_ENABLE_MEMORY_USEFULNESS_SCORING`
- `PANDORA_ENABLE_MEMORY_PRUNING`
- `PANDORA_MEMORY_PRUNING_MODE`
- `PANDORA_MEMORY_SCORING_VERSION`

Dangerous gates default to false.
Optional safe-default gates must not be treated as required provider envs.

## Phase 3B target

Build a gated internal memory browser.

The preferred implementation is:

- route: `/admin/memory/browser` or upgrade `/admin/memory/readback`
- logged-in Supabase session required
- read-only
- user-scoped through RLS or server-derived user identity
- namespace-scoped
- source-backed
- patch-backed
- audit-backed
- no retrieval
- no embeddings
- no model calls
- no GPT Actions
- no MCP
- no public reads
- no public persistence

## Phase 5D execution rule

Phase 5D is not done merely because the migration exists.

Completion requires:

1. code merged
2. migration applied
3. production READY
4. protected dry-runs completed for `real_life` and `au`
5. dry-run output reviewed
6. explicit approval before any `dryRun:false` run
7. post-run database verification

Pruning remains review-only unless explicitly approved.

## Development checks

Before marking work complete, run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run env:policy
```

If a command cannot run due platform limits or unavailable dependencies, report the exact blocker and do not claim completion.

## Response style for future agents

Be direct. Be honest about what is shipped versus only planned. Do not claim memory, retrieval, scoring, pruning, MCP, or production rollout works unless verified by receipt, database proof, deployed route proof, or merged PR evidence.
