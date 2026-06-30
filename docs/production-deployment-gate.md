# Production Deployment Gate

This file records the Phase 6A.2 production deployment gate.

## Current target

Production must deploy commit `4327f96601d2a3ac4ee5ef24711faf33ba3d8844` or a later commit that includes the Phase 6A.2 operating smoke workflow.

## Required production checks

- `/api/health` returns 200.
- `/operating` returns 200 while signed out.
- `/operating/smoke` returns 200 while signed out and shows the login state.
- A signed-in user can seed and complete the operating smoke workflow.

## Note

This file was added to trigger the Git integration after the previous production deployment was blocked by Vercel build-rate limits.
