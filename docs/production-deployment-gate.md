# Production Deployment Gate

This file records the Phase 6A.2 production deployment gate and intentionally triggers the Git integration after Vercel quota recovery.

## Current target

Production must deploy commit `db07be334dfdaa331c8de231453a48b1dfa088c0` or a later commit that includes:

- Phase 6A.2 operating smoke workflow
- `/operating/smoke`
- `/api/operating/smoke`
- Phase 6B planning document only

## Required production checks

- `/api/health` returns 200.
- `/operating` returns 200 while signed out.
- `/operating/smoke` returns 200 while signed out and shows the login state.
- A signed-in user can seed and complete the operating smoke workflow.

## Current blocker being retested

Production was still pinned to an older Phase 6A.1 deployment after the previous Vercel build-rate-limit failure.

This update is docs-only and exists to trigger a fresh production deployment from `main`.

## Retest timestamp

2026-06-30T20:15:00Z
