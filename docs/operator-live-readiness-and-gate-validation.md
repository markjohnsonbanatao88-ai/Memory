# Operator live readiness and gate validation

This change adds operator readiness and runtime gate validation for Pandora Memory Engine deployment preparation. It does **not** activate public production persistence, production ingest writes, public memory reads, model calls, embeddings, pgvector, semantic retrieval, GPT Actions, or MCP.

Dangerous gates default to `false`. The readiness endpoint is read-only, and the readiness UI does not execute persistence. Public persistence is disabled by default. Production ingest writes are disabled. Secrets are redacted and never displayed.

Operators must pass the deployment checklist before live use. The checklist verifies auth/session, Supabase configuration, RLS/RPC readiness, read-only persisted APIs, private admin console gates, operator QA gates, memory browser read-only behavior, audit, idempotency, and disabled future semantic retrieval features.

Safety boundaries remain unchanged: AU/story memory cannot become real-life evidence. Real-life memory cannot enter AU unless explicitly fictionalized and reviewed.
