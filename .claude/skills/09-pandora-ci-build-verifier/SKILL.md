# Pandora CI Build Verifier

## Purpose

Standardize local and CI verification before claiming Pandora work is complete.

## Required commands

Run, or request evidence for:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run env:policy
```

If a script does not exist, inspect `package.json` and run the closest equivalent. If a command cannot run due environment limits, state the blocker exactly.

## Reporting format

For each command, report:

- command
- pass/fail
- exit code if known
- important output summary
- failing file/test if failed
- exact next fix

## Forbidden

- Do not say CI is green without check evidence.
- Do not hide failing tests.
- Do not skip `env:policy` when env behavior changed.
- Do not claim build passed if only typecheck passed.

## Completion standard

All required checks pass, or failures are documented with exact next steps and no false completion claim.
