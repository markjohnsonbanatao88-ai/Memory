# Deployment Diagnostics Skill

Use this skill when Vercel, build, preview, or runtime behavior needs diagnosis.

## Goal

Separate real code failures from platform limits, missing env config, auth issues, or runtime errors.

## Checklist

1. Identify deployment target:
   - production
   - preview
   - local build

2. Check build status:
   - success
   - failed due code
   - failed due quota/rate limit
   - failed due missing env
   - failed due external service

3. Check known non-code blockers:
   - Vercel deployment quota
   - project/team permission
   - missing Supabase env vars
   - missing anonymous auth setting
   - missing runtime gate env vars

4. Check route availability:
   - route exists in build output
   - route returns expected auth gate
   - route does not expose memory publicly

5. Check safety gates remain disabled:
   - public reads
   - public persistence
   - retrieval
   - embeddings
   - model calls
   - GPT Actions
   - MCP

## Output format

Return:

- Environment checked
- Deployment status
- Code failure or platform failure
- Route status
- Env/gate risk
- Next action

Never ask the user to paste secrets or tokens into chat.
