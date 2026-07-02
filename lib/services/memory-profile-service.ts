/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MemoryBridgeDbClient, MemoryBridgeNamespace } from "@/lib/services/memory-bridge-service";
import { extractAdaptiveProfile, type AdaptiveProfileSourceEvent } from "@/lib/services/adaptive-profile-extractor";

export type MemoryProfileInput = {
  user_id: string;
  namespace: MemoryBridgeNamespace;
  profile_type: string;
  subject_key: string;
  title: string;
  summary: string;
  facts?: unknown[];
  preferences?: unknown[];
  patterns?: unknown[];
  risks?: unknown[];
  open_loops?: unknown[];
  decisions?: unknown[];
  evidence_refs?: unknown[];
  confidence?: number;
  dry_run?: boolean;
};

export type MemoryProfileUpsertResult = { ok: true; dry_run: boolean; profile: any; previous_profile?: any; blockers: string[]; warnings: string[] } | { ok: false; dry_run: boolean; blockers: string[]; warnings: string[]; next_step: string };

function arr(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function mergeEvidence(a: unknown, b: unknown) {
  const seen = new Set<string>();
  return [...arr(a), ...arr(b)].filter((item) => { const key = JSON.stringify(item); if (seen.has(key)) return false; seen.add(key); return true; });
}

export async function upsertVersionedMemoryProfile(client: MemoryBridgeDbClient, input: MemoryProfileInput): Promise<MemoryProfileUpsertResult> {
  const existing = await (client.from("memory_profiles").select("*").eq("user_id", input.user_id).eq("namespace", input.namespace).eq("profile_type", input.profile_type).eq("subject_key", input.subject_key).eq("status", "active").order("version", { ascending: false }).limit(1) as any as Promise<{ data: any[] | null; error: { message: string } | null }>);
  if (existing.error) return { ok: false, dry_run: !!input.dry_run, blockers: ["profile_read_failed"], warnings: [existing.error.message], next_step: "Check memory_profiles RLS and schema." };
  const previous = existing.data?.[0];
  const version = Number(previous?.version ?? 0) + 1;
  const row = {
    user_id: input.user_id,
    namespace: input.namespace,
    profile_type: input.profile_type,
    subject_key: input.subject_key,
    title: input.title,
    summary: input.summary,
    facts: input.facts ?? [],
    preferences: input.preferences ?? [],
    patterns: input.patterns ?? [],
    risks: input.risks ?? [],
    open_loops: input.open_loops ?? [],
    decisions: input.decisions ?? [],
    evidence_refs: mergeEvidence(previous?.evidence_refs, input.evidence_refs),
    confidence: input.confidence ?? previous?.confidence ?? 0.6,
    status: "active",
    version,
    supersedes_profile_id: previous?.id,
    updated_at: new Date().toISOString(),
  };
  if (input.dry_run) return { ok: true, dry_run: true, profile: row, previous_profile: previous, blockers: [], warnings: [] };
  if (previous?.id) await client.from("memory_profiles").update({ status: "superseded", superseded_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", previous.id).eq("user_id", input.user_id).eq("namespace", input.namespace).select("*").single();
  const inserted = await client.from("memory_profiles").insert(row).select("*").single();
  if (inserted.error || !inserted.data) return { ok: false, dry_run: false, blockers: ["profile_write_failed"], warnings: [inserted.error?.message ?? "unknown profile write failure"], next_step: "Check memory_profiles schema and RLS." };
  return { ok: true, dry_run: false, profile: inserted.data, previous_profile: previous, blockers: [], warnings: [] };
}

export async function upsertProfileFromMemoryEvents(client: MemoryBridgeDbClient, input: { user_id: string; namespace: MemoryBridgeNamespace; profile_type: string; subject_key: string; summary: string; evidence_refs: unknown[]; dry_run?: boolean }) {
  return upsertVersionedMemoryProfile(client, { ...input, title: input.subject_key, confidence: input.evidence_refs.length ? 0.65 : 0.4 });
}

// Reads the user's namespace-scoped memory events, extracts a structured adaptive profile
// deterministically (no model calls / embeddings), and upserts a versioned profile row.
// This is what makes refresh_adaptive_profiles actually populate real profile content
// instead of writing an empty stub.
export async function refreshAdaptiveProfileFromEvents(
  client: MemoryBridgeDbClient,
  input: { user_id: string; namespace: MemoryBridgeNamespace; profile_type?: string; subject_key?: string; dry_run?: boolean; max_events?: number },
) {
  const limit = Math.min(Math.max(input.max_events ?? 200, 1), 500);
  const read = await (client
    .from("memory_events")
    .select("id,source,source_ref,extracted_summary,raw_text,importance,sensitivity,status,created_at")
    .eq("user_id", input.user_id)
    .eq("namespace", input.namespace)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(limit) as any as Promise<{ data: AdaptiveProfileSourceEvent[] | null; error: { message: string } | null }>);
  const emptyCounts = { event_count: 0, preferences: 0, facts: 0, decisions: 0, open_loops: 0, risks: 0 };
  if (read.error) {
    return { ok: false, dry_run: !!input.dry_run, blockers: ["event_read_failed"], warnings: [read.error.message], next_step: "Check memory_events RLS and schema.", extracted: emptyCounts };
  }
  const extracted = extractAdaptiveProfile(read.data ?? [], input.namespace);
  const result = await upsertVersionedMemoryProfile(client, {
    user_id: input.user_id,
    namespace: input.namespace,
    profile_type: input.profile_type ?? "operating_profile",
    subject_key: input.subject_key ?? "global",
    title: input.subject_key ?? "global",
    summary: extracted.summary,
    facts: extracted.facts,
    preferences: extracted.preferences,
    patterns: extracted.patterns,
    risks: extracted.risks,
    open_loops: extracted.open_loops,
    decisions: extracted.decisions,
    evidence_refs: extracted.evidence_refs,
    confidence: extracted.confidence,
    dry_run: input.dry_run,
  });
  return {
    ...result,
    extracted: {
      event_count: extracted.event_count,
      preferences: extracted.preferences.length,
      facts: extracted.facts.length,
      decisions: extracted.decisions.length,
      open_loops: extracted.open_loops.length,
      risks: extracted.risks.length,
    },
  };
}
export const updateOperatingProfile = upsertProfileFromMemoryEvents;
export const updateStyleProfile = upsertProfileFromMemoryEvents;
export const updateRiskProfile = upsertProfileFromMemoryEvents;
export const updateProjectProfile = upsertProfileFromMemoryEvents;
