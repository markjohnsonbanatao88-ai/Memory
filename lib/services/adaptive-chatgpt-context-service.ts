/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MemoryBridgeDbClient, MemoryBridgeNamespace } from "@/lib/services/memory-bridge-service";
import { getHybridMemoryContext } from "@/lib/services/memory-hybrid-retrieval-service";

// Flatten a profile array field (facts/preferences/...) into plain text lines for the
// ChatGPT-facing context. Items may be strings or { text, ... } objects.
function profileLines(items: unknown): string[] {
  return (Array.isArray(items) ? items : [])
    .map((item: any) => (typeof item === "string" ? item : String(item?.text ?? "")))
    .filter((text) => text.trim().length > 0);
}

export async function buildAdaptiveChatGptContext(
  client: MemoryBridgeDbClient,
  input: { user_id: string; namespace: MemoryBridgeNamespace; query?: string; current_task?: string; max_items?: number },
) {
  const ctx = await getHybridMemoryContext(client, input);
  // Latest active operating profile produced by refresh_adaptive_profiles.
  const operating = (ctx.adaptive_profile ?? [])[0] ?? null;
  const preferences = profileLines(operating?.preferences);
  const facts = profileLines(operating?.facts);
  const decisions = profileLines(operating?.decisions);
  return {
    identity_context: "Private Pandora memory context for Joven; keep real_life and au namespaces separate.",
    answer_style:
      "Blunt, execution-focused, concise but complete. Do not overpraise. Separate coded, deployed, connected, authenticated, tool-discovered, tool-called successfully, and fully proven.",
    current_priorities: ctx.latest_context_pack?.key_points ?? [],
    active_projects: ctx.project_context,
    risk_warnings: ctx.risk_warnings,
    relationship_loops: ctx.open_loops.filter((l: any) => String(l.loop_type).includes("relationship")),
    // Extracted profile preferences surface as the namespace-appropriate rule set.
    business_rules: input.namespace === "real_life" ? preferences : [],
    technical_rules: ["Do not call a task done without verification.", "Do not save or expose secrets."],
    writing_rules: input.namespace === "au" ? preferences : [],
    decision_rules: [
      ...decisions,
      "Ask for review before saving sensitive/private memory.",
      "Keep public read/write disabled.",
    ],
    // Extracted durable facts are surfaced alongside recent events.
    do_not_forget: [...facts, ...ctx.recent_events],
    do_not_do: [
      "Do not retrieve across users or namespaces.",
      "Do not store raw secrets.",
      "Do not use public memory reads/writes.",
    ],
    adaptive_profile_summary: operating?.summary ?? null,
    adaptive_profile_confidence: operating?.confidence ?? null,
    retrieval_hints: ctx.retrieval_reasoning_summary,
    warnings: ctx.warnings,
    updated_at: new Date().toISOString(),
  };
}
