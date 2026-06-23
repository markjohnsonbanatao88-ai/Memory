# Persisted-memory browser UI

This PR adds a read-only persisted-memory browser UI for safe operator inspection of persisted memories, sources, patch history, and audit trail.

The browser uses authenticated, namespace-scoped read APIs/repository boundaries. It does not trust client-supplied `user_id` or `userId`, and every read is scoped to the server-derived user and namespace context.

The browser does not write memory, execute approved-review persistence, activate `/api/memory/ingest`, call OpenAI or any model provider, add embeddings, add pgvector, add semantic retrieval, assemble ChatGPT memory context, add GPT Actions, or add MCP.

Sensitive evidence is redacted by default. AU/story memory is not real-life evidence. Real-life memory cannot enter AU unless explicitly fictionalized and reviewed.

Keyword filtering is keyword-only. Semantic retrieval is not enabled.
