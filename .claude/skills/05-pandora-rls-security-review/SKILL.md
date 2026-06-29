# Pandora RLS Security Review

## Purpose

Ensure Supabase data access remains user-scoped, server-safe, and resistant to privilege bypass.

## Review targets

- Supabase RLS policies.
- Server/admin bridge clients.
- API routes that read or write memory.
- Storage policies.
- SQL migrations.
- Client components that may accidentally import server secrets.

## Required checks

- User data tables have RLS enabled.
- Policies use `auth.uid()` or a trusted server-derived identity where appropriate.
- Service-role or bridge-admin clients are server-only.
- Request bodies cannot choose arbitrary `user_id` for writes.
- Public routes do not expose private memory.
- Client code does not import service-role keys, database URLs, or internal tokens.
- Admin routes require operator/internal protection.

## Forbidden

- Do not disable RLS to make a feature work.
- Do not bypass RLS from public/client code.
- Do not trust client-supplied identity.
- Do not expose service-role behavior to the browser.

## Completion standard

Report RLS state, policies found, identity source, route protection, and any remaining security blocker.
