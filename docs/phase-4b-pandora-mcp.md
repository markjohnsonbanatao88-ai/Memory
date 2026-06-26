# Phase 4B: Pandora MCP Server

Phase 4B adds a thin MCP adapter over the existing Pandora Memory Engine services. It does not replace Phase 4A REST Actions and does not enable public memory reads, public writes, model calls, embeddings, or semantic retrieval.

## What MCP adds compared with Phase 4A Actions

Phase 4A exposes REST endpoints for ChatGPT Actions:

- `/api/memory/context`
- `/api/memory/capture`
- `/api/memory/distill`

Phase 4B exposes the same safe memory capabilities as discoverable MCP tools for ChatGPT Custom Tool / MCP setup:

- `get_latest_context_pack`
- `get_memory_context`
- `capture_memory_event`
- `distill_context_pack`

## Required environment variables

- `PANDORA_ENABLE_MCP=true`
- `PANDORA_MCP_TOKEN=<strong private bearer token>`
- `PANDORA_MCP_USER_ID=<scoped Supabase user id>`
- `PANDORA_MCP_DB_KEY=<server-only Supabase key>`
- `PANDORA_ENABLE_MCP_CAPTURE=true` only when reviewed capture is allowed
- `PANDORA_ENABLE_MCP_DISTILLATION=true` only when deterministic distillation is allowed

Optional:

- `PANDORA_MCP_ALLOWED_ORIGINS=https://chatgpt.com,https://chat.openai.com`

Never prefix MCP token or DB key with `NEXT_PUBLIC_`. Never enter the Supabase DB key into ChatGPT.

## Vercel setup

Configure the variables above in the Vercel production project `barangayoss-projects/memory`. Leave `PANDORA_ENABLE_MCP=false` to disable the whole MCP adapter instantly.

## ChatGPT Custom Tool setup

- Name: `Pandora Memory`
- Description: `Private Pandora memory/context bridge.`
- Server URL:
  - First try `https://pandorasmemory.vercel.app/api/mcp`
  - If the UI expects an SSE URL, use `https://pandorasmemory.vercel.app/api/mcp/sse`
- Authentication:
  - Use API key / Bearer token if available.
  - Use only `PANDORA_MCP_TOKEN` as the bearer token.
  - Never use `PANDORA_MCP_DB_KEY` or any Supabase service key in ChatGPT.

## Test order

1. Call `get_latest_context_pack` for `real_life`.
2. Call `get_memory_context` for `real_life` with a compact `current_task`.
3. Enable `PANDORA_ENABLE_MCP_CAPTURE=true`, then call `capture_memory_event` with a short reviewed event.
4. Enable `PANDORA_ENABLE_MCP_DISTILLATION=true`, then call `distill_context_pack` with `pack_type=daily`.

## Rollback

Set `PANDORA_ENABLE_MCP=false` and redeploy/reload environment. The Phase 4A REST bridge remains separate.

## Security warnings

Custom MCP servers are powerful. Keep this server private and minimal. This phase intentionally has no delete, archive, edit, bulk-write, public read, public write, model-call, embedding, semantic retrieval, GPT Action expansion, or unrestricted MCP behavior.

## Vercel transport note

The primary endpoint uses the official MCP SDK Streamable HTTP transport in stateless JSON-response mode to fit Vercel serverless. `/api/mcp/sse` is a compatibility alias for clients whose UI asks for an SSE-shaped URL; if a client requires long-lived stateful SSE sessions, deploy the same server behind a persistent Node.js service later.
