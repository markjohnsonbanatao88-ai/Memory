import type { MemoryBridgeDbClient, MemoryBridgeNamespace } from "@/lib/services/memory-bridge-service";
import type { PandoraMcpPrincipal } from "@/lib/services/mcp-auth";

export async function auditPandoraMcpToolCall(
  client: MemoryBridgeDbClient,
  input: { principal: Extract<PandoraMcpPrincipal, { ok: true }>; tool: string; namespace: MemoryBridgeNamespace; recordId?: string; requestId?: string },
) {
  try {
    const result = await client.from("audit_logs").insert({
      user_id: input.principal.userId,
      namespace: input.namespace,
      action: input.tool,
      table_name: "mcp_tools",
      record_id: input.recordId,
      after_snapshot: { source: "chatgpt_mcp", tool: input.tool, auth_type: input.principal.authType, namespace: input.namespace, request_id: input.requestId },
      metadata: { source: "chatgpt_mcp", tool: input.tool, auth_type: input.principal.authType, namespace: input.namespace, request_id: input.requestId, phase: "4B_pandora_mcp" },
    }).select("*").single();
    return result.error ? { ok: false as const, warning: result.error.message } : { ok: true as const };
  } catch (error) {
    console.error("Pandora MCP audit failed", error instanceof Error ? error.message : "unknown error");
    return { ok: false as const, warning: "mcp_audit_failed" };
  }
}
