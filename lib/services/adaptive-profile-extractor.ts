import type { MemoryBridgeNamespace } from "@/lib/services/memory-bridge-service";
import { classifyContent, clamp01 } from "@/lib/services/memory-usefulness-scoring-service";

// Deterministic adaptive-profile extraction.
//
// Turns a user's namespace-scoped memory events into a structured operating profile
// (preferences, facts, decisions, open loops, risks) with a deterministic confidence.
// Intentionally model-free and embedding-free: every output is a pure function of the
// events' text/importance/sensitivity, so it is safe to run without PANDORA_ENABLE_MODEL_CALLS
// or PANDORA_ENABLE_EMBEDDINGS. Reuses the Phase 5D deterministic content classifier.

export type AdaptiveProfileSourceEvent = {
  id?: string | null;
  source?: string | null;
  extracted_summary?: string | null;
  raw_text?: string | null;
  importance?: number | null;
  sensitivity?: string | null;
  status?: string | null;
  created_at?: string | null;
  memory_type?: string | null;
};

export type AdaptiveProfileItem = { text: string; event_id: string | null; importance: number | null };

export type ExtractedAdaptiveProfile = {
  summary: string;
  facts: AdaptiveProfileItem[];
  preferences: AdaptiveProfileItem[];
  patterns: AdaptiveProfileItem[];
  risks: AdaptiveProfileItem[];
  open_loops: AdaptiveProfileItem[];
  decisions: AdaptiveProfileItem[];
  evidence_refs: Array<{ event_id: string | null; source: string | null }>;
  confidence: number;
  event_count: number;
};

const DECISION_RE = /\b(decided|decision|approved|chose|choosing|merged|agreed|confirm(?:ed)?)\b/i;
const RISK_RE = /\b(risk|danger|concern|blocker|warning|do not|don't|avoid|must not|never|boundary|consent)\b/i;

function eventText(event: AdaptiveProfileSourceEvent): string {
  return String(event.extracted_summary ?? event.raw_text ?? "").replace(/\s+/g, " ").trim();
}

function clip(text: string, max = 240): string {
  return text.length > max ? text.slice(0, max) : text;
}

export function extractAdaptiveProfile(
  events: AdaptiveProfileSourceEvent[],
  namespace: MemoryBridgeNamespace,
): ExtractedAdaptiveProfile {
  const facts: AdaptiveProfileItem[] = [];
  const preferences: AdaptiveProfileItem[] = [];
  const patterns: AdaptiveProfileItem[] = [];
  const risks: AdaptiveProfileItem[] = [];
  const openLoops: AdaptiveProfileItem[] = [];
  const decisions: AdaptiveProfileItem[] = [];
  const evidenceRefs: Array<{ event_id: string | null; source: string | null }> = [];
  const seen = new Set<string>();

  for (const event of events) {
    if (event.status === "archived") continue;
    const raw = eventText(event);
    if (!raw) continue;
    const key = raw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const item: AdaptiveProfileItem = { text: clip(raw), event_id: event.id ?? null, importance: event.importance ?? null };
    evidenceRefs.push({ event_id: event.id ?? null, source: event.source ?? null });

    const category = classifyContent({
      text: raw,
      memory_type: event.memory_type ?? null,
      importance: event.importance ?? null,
      source: event.source ?? null,
    });
    const sensitive = event.sensitivity === "high" || event.sensitivity === "private";
    const isRisk = RISK_RE.test(raw) || sensitive;
    const isDecision = DECISION_RE.test(raw);

    if (isRisk) risks.push(item);
    if (isDecision) decisions.push(item);

    switch (category) {
      case "durable_preference":
        preferences.push(item);
        break;
      case "production_fact":
        facts.push(item);
        break;
      case "task_state":
        openLoops.push(item);
        break;
      default:
        if (!isRisk && !isDecision) patterns.push(item);
        break;
    }
  }

  const evidenceCount = evidenceRefs.length;
  const preferenceShare = evidenceCount ? preferences.length / evidenceCount : 0;
  // Deterministic confidence: grows with evidence volume and preference share, capped at 0.95.
  const confidence = evidenceCount === 0
    ? 0.4
    : clamp01(0.5 + Math.min(evidenceCount, 10) * 0.03 + preferenceShare * 0.15);

  const summary = evidenceCount === 0
    ? `No ${namespace} memories available to build an adaptive profile.`
    : `Adaptive ${namespace} operating profile from ${evidenceCount} memories: `
      + `${preferences.length} preferences, ${facts.length} facts, ${decisions.length} decisions, `
      + `${openLoops.length} open loops, ${risks.length} risks.`;

  return {
    summary,
    facts,
    preferences,
    patterns,
    risks,
    open_loops: openLoops,
    decisions,
    evidence_refs: evidenceRefs,
    confidence,
    event_count: evidenceCount,
  };
}
