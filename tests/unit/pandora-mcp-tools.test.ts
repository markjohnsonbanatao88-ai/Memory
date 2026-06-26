import { describe, expect, it } from "vitest";
import { capMcpMaxItems, captureMemoryEventTool, distillContextPackTool, getLatestContextPackTool, getMemoryContextTool } from "@/lib/services/pandora-mcp-tools";

const principal = { ok: true, authType: "mcp_bearer_token", userId: "user-1" } as const;
function client(seed: Record<string, unknown[]> = {}) {
  const rows = { memory_context_packs: [...(seed.memory_context_packs ?? [])], memory_events: [...(seed.memory_events ?? [])], audit_logs: [] as Record<string, unknown>[] } as Record<string, Record<string, unknown>[]>;
  return { rows, from(table: string) { let data = [...(rows[table] ?? [])]; let pending: Record<string, unknown> | null = null; const api = { select(){ return api; }, insert(value: Record<string, unknown>){ pending = { id: `${table}-${(rows[table] ?? []).length + 1}`, created_at: "2026-06-26T00:00:00.000Z", ...value }; rows[table] ??= []; rows[table].push(pending); data = [pending]; return api; }, update(){ return api; }, eq(column: string, value: unknown){ data = data.filter((row) => row[column] === value); return api; }, neq(column: string, value: unknown){ data = data.filter((row) => row[column] !== value); return api; }, order(column: string){ data = data.sort((a, b) => String(b[column] ?? "").localeCompare(String(a[column] ?? ""))); return api; }, limit(count: number){ data = data.slice(0, count); return api; }, async single(){ return { data: pending ?? data[0] ?? null, error: null }; }, async range(){ return { data, error: null }; }, then(resolve: (value: unknown) => void){ return Promise.resolve({ data, error: null }).then(resolve); } }; return api; } } as never;
}

describe("Pandora MCP tools", () => {
  it("blocks capture when capture gate is disabled", async () => {
    const result = await captureMemoryEventTool(client(), principal, { namespace: "real_life", raw_text: "Remember this" }, { PANDORA_ENABLE_MCP_CAPTURE: "false" });
    expect(result).toMatchObject({ ok: false, code: "mcp_capture_disabled" });
  });
  it("blocks distillation when distillation gate is disabled", async () => {
    const result = await distillContextPackTool(client(), principal, { namespace: "real_life", pack_type: "daily" }, { PANDORA_ENABLE_MCP_DISTILLATION: "false" });
    expect(result).toMatchObject({ ok: false, code: "mcp_distillation_disabled" });
  });
  it("latest context pack scopes to PANDORA_MCP_USER_ID principal", async () => {
    const c = client({ memory_context_packs: [
      { id: "other", user_id: "other", namespace: "real_life", status: "active", pack_type: "daily", created_at: "2026-06-26T01:00:00.000Z" },
      { id: "mine", user_id: "user-1", namespace: "real_life", status: "active", pack_type: "daily", created_at: "2026-06-26T00:00:00.000Z" },
    ] });
    const result = await getLatestContextPackTool(c, principal, { namespace: "real_life" });
    expect(result.context_pack?.id).toBe("mine");
  });
  it("validates namespace input", async () => {
    await expect(getMemoryContextTool(client(), principal, { namespace: "public" })).rejects.toThrow();
  });
  it("caps max_items at 20", async () => {
    expect(capMcpMaxItems(99)).toBe(20);
    const events = Array.from({ length: 30 }, (_, i) => ({ id: `e-${i}`, user_id: "user-1", namespace: "real_life", status: "captured", source: "operator_note", raw_text: `Event ${i}`, created_by: "user-1", created_at: `2026-06-${String(i + 1).padStart(2, "0")}T00:00:00.000Z` }));
    const result = await getMemoryContextTool(client({ memory_events: events }), principal, { namespace: "real_life", max_items: 99 });
    expect(result.recent_events).toHaveLength(20);
  });
});
