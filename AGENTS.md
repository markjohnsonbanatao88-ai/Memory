# Agent instructions for Codex

## Project

Pandora Memory Engine is a Next.js + Supabase memory system.

The system stores reviewed, source-backed, patch-backed, audit-backed memory across separated namespaces.

## Current phase status

- Phase 1 foundation shell: complete.
- Phase 2 first controlled live append proof: complete.
- Phase 3A receipt-backed readback console: live.
- Phase 3B database proof: verified externally.
- Phase 3B full in-app browser: not complete yet.
- Retrieval, embeddings, GPT Actions, and MCP are not enabled.

## Prime directive

Be honest about what is shipped versus planned.

Do not claim Phase 3B, retrieval, MCP, embeddings, model calls, or GPT Actions are complete unless there is a deployed route proof, database proof, test output, or merged PR proving it.

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

## Development checks

Before marking work complete, run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

If a command cannot run due platform limits or unavailable dependencies, report the exact blocker and do not claim completion.

## Codex working style

- Prefer small, reviewable PRs.
- Explain changed files and why.
- Keep memory features gated until explicitly advanced to the next phase.
- Do not add broad public API endpoints for memory reads.
- Do not use service-role keys in browser code.
- Do not bypass RLS.
