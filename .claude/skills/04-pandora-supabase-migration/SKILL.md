# Pandora Supabase Migration

## Purpose

Review and apply Supabase migrations safely for Pandora Memory.

## Migration review checklist

Before applying a migration, verify:

- Additive where possible.
- No `drop table`, `drop column`, destructive `delete`, or broad `update` unless explicitly approved.
- New columns are nullable or have safe defaults.
- Check constraints are compatible with existing data.
- RLS is enabled on new user data tables.
- Policies are user-scoped or server-admin-only as appropriate.
- Indexes are safe and scoped for expected queries.
- The migration does not expose secrets or weaken auth.

## Apply sequence

1. Inspect migration file.
2. Identify target Supabase project by name/ref.
3. Apply migration only to the intended project.
4. Verify `supabase_migrations.schema_migrations` entry when available.
5. Verify actual schema through `information_schema`, `pg_tables`, `pg_indexes`, and `pg_policies` as appropriate.
6. Report exactly what changed.

## Forbidden

- Do not apply a destructive migration without explicit user approval and rollback plan.
- Do not assume a migration applied just because the file exists.
- Do not skip post-apply schema verification.

## Completion standard

Report project ref, migration version/name, additive/destructive classification, verified tables/columns/indexes/policies, and remaining rollout steps.
