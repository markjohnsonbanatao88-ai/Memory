# Controlled one-item execution runbook

This PR adds the internal operator runbook for one controlled real memory append. It does not execute automatically and only validates an operator plan before a separate internal live one-item workflow is used.

The runbook requires one approved review item, one `approve_append` decision, a preview, an idempotency key, and typed confirmation of `APPEND MEMORY`. After execution by the existing internal workflow, the operator must capture the workflow receipt, run the one-item proof report, and verify readback, browser visibility, and audit events.

The operator must stop after one item. Do not batch. Do not proceed to retrieval.

This change does not activate public persistence, production ingest writes, public reads, model calls, embeddings, semantic retrieval, GPT Actions, MCP, or ChatGPT context assembly. All memory persistence remains append-only and all proof records remain append-only.

AU/story memory cannot become real-life evidence. Real-life memory cannot enter AU unless explicitly fictionalized and reviewed.
