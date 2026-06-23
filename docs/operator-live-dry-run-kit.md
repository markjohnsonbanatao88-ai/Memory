# Operator live dry-run kit

This PR adds an operator-safe live dry-run kit for Pandora Memory Engine first manual use checks.

The dry-run validates auth/session resolution, explicit namespace availability, runtime gates, redacted environment safety, persisted-memory read APIs, memory browser readiness, private admin persistence console gate visibility, operator QA flow gate status, and audit/idempotency requirements.

The dry-run does not write memory, does not execute persistence, does not activate ingest, does not expose public reads or public writes, and does not call models. It does not add embeddings, pgvector, semantic retrieval, GPT Actions, or MCP.

Empty memory can still pass as `ready_empty` when list/detail/source/patch/audit read APIs are healthy and namespace-scoped. Records, if present, are accessed only through the injected authenticated read repository and read-only browser loader.

Operators must pass readiness and this live dry-run before first manual live use. The first manual workflow should continue to use the existing review queue and internal gates; normal clients still cannot trigger persistence.

Safety boundaries remain unchanged: AU/story memory cannot become real-life evidence, and real-life memory cannot enter AU unless explicitly fictionalized and reviewed.
