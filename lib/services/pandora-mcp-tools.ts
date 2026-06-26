import { z } from "zod";
import type { PandoraMcpPrincipal } from "@/lib/services/mcp-auth";
import { requireMcpCaptureEnabled, requireMcpDistillationEnabled } from "@/lib/services/mcp-auth";
import type { MemoryBridgeDbClient, MemoryBridgeNamespace, MemoryContextPack, MemoryEvent } from "@/lib/services/memory-bridge-service";
import { createContextPack } from "@/lib/services/memory-bridge-service";
import { buildDailyContextPack, buildMasterContextPack, compactContextResponse } from "@/lib/services/memory-distillation-service";
import { auditPandoraMcpToolCall } from "@/lib/services/pandora-mcp-audit";

const namespaceSchema = z.enum(["real_life", "au"]);
export const latestContextPackInputSchema = z.object({ namespace: namespaceSchema, pack_type: z.enum(["daily", "master"]).optional() });
export const memoryContextInputSchema = z.object({ namespace: namespaceSchema, query: z.string().optional(), current_task: z.string().optional(), max_items: z.number().int().positive().max(100).optional(), include_risks: z.boolean().optional(), include_people: z.boolean().optional(), include_projects: z.boolean().optional() });
export const captureMemoryEventInputSchema = z.object({ namespace: namespaceSchema, raw_text: z.string().trim().min(1).max(8000), source: z.string().trim().max(120).optional(), source_ref: z.string().trim().max(500).optional(), importance: z.number().int().min(1).max(10).optional(), sensitivity: z.enum(["low", "medium", "high", "private"]).optional() });
export const distillContextPackInputSchema = z.object({ namespace: namespaceSchema, pack_type: z.enum(["daily", "master"]) });

const runtime = (capture = false, distill = false) => ({ config: { memoryCaptureApiEnabled: capture, memoryContextApiEnabled: true, memoryDistillationEnabled: distill }, gates: { memoryCaptureApiEnabled: { envVar: "PANDORA_ENABLE_MCP_CAPTURE" }, memoryContextApiEnabled: { envVar: "PANDORA_ENABLE_MCP" }, memoryDistillationEnabled: { envVar: "PANDORA_ENABLE_MCP_DISTILLATION" } } }) as never;
function bridgePrincipal(principal: Extract<PandoraMcpPrincipal, { ok: true }>) { return { ok: true as const, userId: principal.userId, createdBy: principal.userId, authType: "bridge_token" as const, operator: true }; }
function eventSummary(event: MemoryEvent) { return event.extracted_summary ?? event.raw_text.replace(/\s+/g, " ").trim().slice(0, 240); }
function warning(audit: { ok: boolean; warning?: string }) { return audit.ok ? [] : [audit.warning ?? "mcp_audit_failed"]; }

export async function getLatestContextPackTool(client: MemoryBridgeDbClient, principal: Extract<PandoraMcpPrincipal, { ok: true }>, rawInput: unknown) {
  const input = latestContextPackInputSchema.parse(rawInput);
  let query = client.from<MemoryContextPack>("memory_context_packs").select("id,namespace,pack_type,title,summary,key_points,active_projects,people_map,decisions,risks,open_loops,created_at").eq("user_id", principal.userId).eq("namespace", input.namespace).eq("status", "active").order("created_at", { ascending: false }).limit(1);
  if (input.pack_type) query = query.eq("pack_type", input.pack_type);
  const result = await (query as unknown as Promise<{ data: MemoryContextPack[] | null; error: { message: string } | null }>);
  if (result.error) throw new Error(`context_pack_read_failed: ${result.error.message}`);
  const audit = await auditPandoraMcpToolCall(client, { principal, tool: "mcp.get_latest_context_pack", namespace: input.namespace });
  return { context_pack: result.data?.[0] ?? null, warnings: warning(audit) };
}

export async function getMemoryContextTool(client: MemoryBridgeDbClient, principal: Extract<PandoraMcpPrincipal, { ok: true }>, rawInput: unknown) {
  const input = memoryContextInputSchema.parse(rawInput);
  const maxItems = Math.min(Math.max(input.max_items ?? 8, 1), 20);
  const packs = await (client.from<MemoryContextPack>("memory_context_packs").select("*").eq("user_id", principal.userId).eq("namespace", input.namespace).eq("status", "active").order("created_at", { ascending: false }).limit(1) as unknown as Promise<{ data: MemoryContextPack[] | null; error: { message: string } | null }>);
  const events = await (client.from<MemoryEvent>("memory_events").select("*").eq("user_id", principal.userId).eq("namespace", input.namespace).neq("status", "archived").order("created_at", { ascending: false }).limit(maxItems) as unknown as Promise<{ data: MemoryEvent[] | null; error: { message: string } | null }>);
  if (packs.error || events.error) throw new Error(`context_read_failed: ${packs.error?.message ?? events.error?.message}`);
  const pack = compactContextResponse(packs.data?.[0] ?? null, events.data ?? [], input);
  const audit = await auditPandoraMcpToolCall(client, { principal, tool: "mcp.get_memory_context", namespace: input.namespace });
  return { namespace: input.namespace, current_task: input.current_task ?? null, context_pack: pack, recent_events: (events.data ?? []).map((event) => ({ id: event.id, source: event.source, summary: eventSummary(event), status: event.status, created_at: event.created_at })).slice(0, maxItems), warnings: [...(packs.data?.[0] ? [] : ["no_active_context_pack_yet"]), ...warning(audit)], open_loops: pack.open_loops };
}

export async function captureMemoryEventTool(client: MemoryBridgeDbClient, principal: Extract<PandoraMcpPrincipal, { ok: true }>, rawInput: unknown, env: Partial<NodeJS.ProcessEnv> = process.env) {
  const gate = requireMcpCaptureEnabled(env); if (!gate.ok) return gate;
  const input = captureMemoryEventInputSchema.parse(rawInput);
  const row = { namespace: input.namespace, user_id: principal.userId, source: input.source || "chatgpt_mcp", source_ref: input.source_ref, raw_text: input.raw_text, extracted_summary: input.raw_text.replace(/\s+/g, " ").trim().slice(0, 240), importance: input.importance ?? 5, sensitivity: input.sensitivity ?? "medium", status: "captured", created_by: principal.userId };
  const result = await client.from<MemoryEvent>("memory_events").insert(row).select("*").single();
  if (result.error || !result.data) throw new Error(`capture_write_failed: ${result.error?.message ?? "unknown write failure"}`);
  const audit = await auditPandoraMcpToolCall(client, { principal, tool: "mcp.capture_memory_event", namespace: input.namespace, recordId: result.data.id });
  return { id: result.data.id, status: result.data.status, namespace: result.data.namespace, source: result.data.source, created_at: result.data.created_at, warnings: warning(audit) };
}

export async function distillContextPackTool(client: MemoryBridgeDbClient, principal: Extract<PandoraMcpPrincipal, { ok: true }>, rawInput: unknown, env: Partial<NodeJS.ProcessEnv> = process.env) {
  const gate = requireMcpDistillationEnabled(env); if (!gate.ok) return gate;
  const input = distillContextPackInputSchema.parse(rawInput);
  const events = await (client.from<MemoryEvent>("memory_events").select("*").eq("user_id", principal.userId).eq("namespace", input.namespace).neq("status", "archived").order("created_at", { ascending: false }).limit(input.pack_type === "master" ? 50 : 25) as unknown as Promise<{ data: MemoryEvent[] | null; error: { message: string } | null }>);
  if (events.error) throw new Error(`event_read_failed: ${events.error.message}`);
  const pack = input.pack_type === "master" ? buildMasterContextPack(input.namespace, principal.userId, events.data ?? []) : buildDailyContextPack(input.namespace, principal.userId, events.data ?? []);
  const result = await createContextPack(client, pack, bridgePrincipal(principal), runtime(false, true));
  if (!result.ok) throw new Error(result.blockers.join(","));
  const audit = await auditPandoraMcpToolCall(client, { principal, tool: "mcp.distill_context_pack", namespace: input.namespace, recordId: result.data.id });
  return { id: result.data.id, namespace: result.data.namespace, pack_type: result.data.pack_type, title: result.data.title, summary: result.data.summary, created_at: result.data.created_at, status: result.data.status, warnings: warning(audit) };
}

export function capMcpMaxItems(value?: number) { return Math.min(Math.max(value ?? 8, 1), 20); }
export type PandoraMcpNamespace = MemoryBridgeNamespace;
