import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MemoryBridgeDbClient } from "@/lib/services/memory-bridge-service";
import type { PandoraMcpPrincipal } from "@/lib/services/mcp-auth";
import { captureMemoryEventTool, distillContextPackTool, getLatestContextPackTool, getMemoryContextTool } from "@/lib/services/pandora-mcp-tools";

function asContent(data: unknown) { return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] }; }

export function createPandoraMcpServer(input: { client: MemoryBridgeDbClient; principal: Extract<PandoraMcpPrincipal, { ok: true }>; env?: Partial<NodeJS.ProcessEnv> }) {
  const server = new McpServer({ name: "pandora-memory", version: "4.0.0" });
  server.registerTool("get_latest_context_pack", { title: "Get latest context pack", description: "Return the latest active Pandora context pack for a namespace and optional pack type.", inputSchema: { namespace: z.enum(["real_life", "au"]), pack_type: z.enum(["daily", "master"]).optional() } }, async (args) => asContent(await getLatestContextPackTool(input.client, input.principal, args)));
  server.registerTool("get_memory_context", { title: "Get memory context", description: "Return compact Pandora memory context for a current ChatGPT task.", inputSchema: { namespace: z.enum(["real_life", "au"]), query: z.string().optional(), current_task: z.string().optional(), max_items: z.number().int().positive().optional(), include_risks: z.boolean().optional(), include_people: z.boolean().optional(), include_projects: z.boolean().optional() } }, async (args) => asContent(await getMemoryContextTool(input.client, input.principal, args)));
  server.registerTool("capture_memory_event", { title: "Capture memory event", description: "Capture a reviewable Pandora memory event from ChatGPT/MCP. Disabled unless PANDORA_ENABLE_MCP_CAPTURE=true.", inputSchema: { namespace: z.enum(["real_life", "au"]), raw_text: z.string().min(1).max(8000), source: z.string().optional(), source_ref: z.string().optional(), importance: z.number().int().min(1).max(10).optional(), sensitivity: z.enum(["low", "medium", "high", "private"]).optional() } }, async (args) => asContent(await captureMemoryEventTool(input.client, input.principal, args, input.env)));
  server.registerTool("distill_context_pack", { title: "Distill context pack", description: "Generate deterministic Pandora context pack without model calls or embeddings. Disabled unless PANDORA_ENABLE_MCP_DISTILLATION=true.", inputSchema: { namespace: z.enum(["real_life", "au"]), pack_type: z.enum(["daily", "master"]) } }, async (args) => asContent(await distillContextPackTool(input.client, input.principal, args, input.env)));
  return server;
}
