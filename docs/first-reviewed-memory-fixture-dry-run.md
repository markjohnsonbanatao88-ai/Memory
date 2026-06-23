# First reviewed-memory fixture dry-run

This PR adds test-only fixtures for the first reviewed-memory dry-run. The fixtures are deterministic local contracts for the manual operator workflow and are clearly marked non-production.

The fixtures do not seed production, do not write production memory, do not activate `/api/memory/ingest`, do not expose public persistence, and do not call models. They add no embeddings, pgvector, semantic retrieval, GPT Actions, or MCP.

Run the harness with:

```bash
npm run verify:first-reviewed-memory-fixture
```

Expected pass scenarios:

- real-life fact append
- AU/story-only append, only in the AU/story namespace

Expected blocked scenarios:

- AU-to-real-life contamination
- missing audit decision
- non-append decision

Receipt verification compares the expected review item, decision, memory item, source, patch count, audit count, readback status, browser visibility status, and audit verification status. Readback uses only an injected in-memory repository, browser visibility uses an injected loader mock, and audit verification checks the expected audit item from the fixture repository.

AU/story memory cannot become real-life evidence. Real-life memory cannot enter AU unless explicitly fictionalized and reviewed.
