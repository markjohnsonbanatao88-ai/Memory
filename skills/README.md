# Pandora agent skills

This folder contains reusable repo-local skills for Codex, Claude Code, and future coding agents working on Pandora Memory Engine.

These skills are procedural guidance only. They do not enable runtime features, memory retrieval, embeddings, model calls, GPT Actions, MCP, public reads, or public persistence.

## Skills

- `memory-safety-review` — inspect changes for memory safety, gate drift, RLS bypasses, service-role misuse, and namespace mixing.
- `phase-status-ledger` — keep phase status honest and synchronized across project docs.
- `phase-3b-verification` — verify the internal read-only memory browser before closing Phase 3B.
- `pull-request-review` — review PRs using Pandora-specific acceptance criteria.
- `deployment-diagnostics` — diagnose Vercel deployment, build, and runtime issues without exposing secrets.
- `supabase-rls-check` — verify Supabase read/write behavior stays user-scoped and RLS-safe.

## Global rules

Always read `AGENTS.md` or `CLAUDE.md` before using these skills.

Never claim a phase is complete unless a merged PR, passing checks, deployment proof, and live verification support it.

Never enable these without explicit review:

- retrieval
- embeddings
- model calls
- GPT Actions
- MCP
- public memory reads
- public memory persistence
- production ingest writes
- batch memory append
