# Pandora Env Broker Drift

## Purpose

Diagnose Env Broker drift without repeating false-positive RED drift caused by optional safe-default gates.

## Core rule

Optional gates with safe runtime defaults must not become required provider envs. Only true bootstrap secrets and provider requirements should trigger RED missing-provider drift.

## Review targets

- `lib/services/env-discovery-service.ts`
- `lib/services/env-validation-service.ts`
- env broker catalog/config files
- admin env routes and drift reports
- CI env policy output

## Required checks

- Classify each env key as required, optional safe-defaulted, provider-managed, public-safe, or unsafe.
- Confirm optional `PANDORA_*` feature flags do not trigger required-provider drift.
- Confirm server-only secrets never become `NEXT_PUBLIC_*`.
- Confirm unsafe key count is zero.
- Confirm missing required keys are real blockers, not feature-flag defaults.

## Forbidden

- Do not push random optional env vars just to silence drift.
- Do not mark every `PANDORA_*` key as required.
- Do not expose provider env values.
- Do not weaken the Env Broker guard to make it green.

## Completion standard

Report drift color, missing required count, unsafe count, broker enabled state, classified unknowns, and the exact code/config reason.
