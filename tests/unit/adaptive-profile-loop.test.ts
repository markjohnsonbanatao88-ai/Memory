/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";
import { extractAdaptiveProfile } from "@/lib/services/adaptive-profile-extractor";
import { refreshAdaptiveProfileFromEvents } from "@/lib/services/memory-profile-service";
import { getHybridMemoryContext } from "@/lib/services/memory-hybrid-retrieval-service";
import { buildAdaptiveChatGptContext } from "@/lib/services/adaptive-chatgpt-context-service";

// Minimal in-memory MemoryBridgeDbClient: chainable, awaitable (thenable), and
// supports .single(). Reads return the configured rows; inserts/updates/selects are spied.
type TableConfig = { rows?: any[]; onInsert?: (row: any) => void; onUpdate?: (patch: any) => void; onSelect?: (cols: string) => void };
function fakeClient(tables: Record<string, TableConfig>) {
  return {
    from(table: string) {
      const cfg = tables[table] ?? {};
      let inserted: any[] | null = null;
      const withIds = (rows: any[]) => rows.map((r, i) => ({ id: r?.id ?? `fake-${table}-${i}`, ...r }));
      const builder: any = {
        select(cols?: string) { if (cols) cfg.onSelect?.(cols); return builder; },
        insert(row: any) { inserted = Array.isArray(row) ? row : [row]; cfg.onInsert?.(row); return builder; },
        update(patch: any) { cfg.onUpdate?.(patch); return builder; },
        eq() { return builder; },
        neq() { return builder; },
        order() { return builder; },
        limit() { return builder; },
        range() { return Promise.resolve({ data: cfg.rows ?? [], error: null }); },
        single() {
          const row = inserted ? withIds(inserted)[0] : (cfg.rows?.[0] ?? null);
          return Promise.resolve({ data: row, error: null });
        },
        then(resolve: any, reject: any) {
          const data = inserted ? withIds(inserted) : (cfg.rows ?? []);
          return Promise.resolve({ data, error: null }).then(resolve, reject);
        },
      };
      return builder;
    },
  } as any;
}

const USER = "64110799-da61-445d-a7b3-57f3d0c7e411";

const auEvents = [
  { id: "e-pref", source: "chatgpt_user_direct", raw_text: "I prefer blunt, execution-focused answers and I hate overpraise.", importance: 9, sensitivity: "low", status: "captured" },
  { id: "e-fact", source: "chatgpt_user_direct", raw_text: "PLP is deployed to production on Vercel.", importance: 8, sensitivity: "medium", status: "captured" },
  { id: "e-decision", source: "chatgpt_user_direct", raw_text: "We decided to use a fictional alias for explicit scenes.", importance: 9, sensitivity: "low", status: "captured" },
  { id: "e-canon", source: "chatgpt_user_direct", raw_text: "In this AU the tone is a psychological erotic thriller.", importance: 7, sensitivity: "low", status: "captured" },
  { id: "e-archived", source: "chatgpt_user_direct", raw_text: "Old superseded note that must be ignored.", importance: 3, sensitivity: "low", status: "archived" },
];

describe("adaptive profile learning loop", () => {
  it("extracts canon/preference/business fact/decision and assigns a bounded confidence", () => {
    const extracted = extractAdaptiveProfile(auEvents, "au");

    // preference / business fact / decision / canon-pattern each land in the right bucket
    expect(extracted.preferences.map((p) => p.event_id)).toContain("e-pref");
    expect(extracted.facts.map((f) => f.event_id)).toContain("e-fact");
    expect(extracted.decisions.map((d) => d.event_id)).toContain("e-decision");
    expect(extracted.patterns.map((p) => p.event_id)).toContain("e-canon");

    // archived events are excluded and evidence is source-backed
    expect(extracted.event_count).toBe(4);
    expect(extracted.evidence_refs.every((r) => r.event_id !== "e-archived")).toBe(true);

    // deterministic confidence in (0, 1], and above the empty-profile floor of 0.4
    expect(extracted.confidence).toBeGreaterThan(0.4);
    expect(extracted.confidence).toBeLessThanOrEqual(1);
    expect(extracted.summary).toContain("Adaptive au operating profile from 4 memories");
  });

  it("refresh_adaptive_profiles saves a populated versioned profile row (non-dry)", async () => {
    let insertedProfile: any = null;
    const client = fakeClient({
      memory_events: { rows: auEvents },
      memory_profiles: { rows: [], onInsert: (row) => { insertedProfile = row; } },
    });

    const result = await refreshAdaptiveProfileFromEvents(client, { user_id: USER, namespace: "au", dry_run: false });

    expect(result.ok).toBe(true);
    expect(result.dry_run).toBe(false);
    // The saved row is real, not an empty stub.
    expect(insertedProfile).not.toBeNull();
    expect(insertedProfile.status).toBe("active");
    expect(insertedProfile.version).toBe(1);
    expect(insertedProfile.profile_type).toBe("operating_profile");
    expect(insertedProfile.preferences.length).toBeGreaterThan(0);
    expect(insertedProfile.facts.length).toBeGreaterThan(0);
    expect(insertedProfile.decisions.length).toBeGreaterThan(0);
    expect(insertedProfile.confidence).toBeGreaterThan(0.4);
    expect(insertedProfile.summary).toContain("Adaptive au operating profile");
    expect(result.extracted.event_count).toBe(4);
  });

  it("dry-run refresh previews the profile without writing", async () => {
    let wrote = false;
    const client = fakeClient({
      memory_events: { rows: auEvents },
      memory_profiles: { rows: [], onInsert: () => { wrote = true; } },
    });
    const result = await refreshAdaptiveProfileFromEvents(client, { user_id: USER, namespace: "au", dry_run: true });
    expect(result.ok).toBe(true);
    expect(result.dry_run).toBe(true);
    expect(wrote).toBe(false);
    if (result.ok) expect(result.profile.preferences.length).toBeGreaterThan(0);
  });

  it("get_adaptive_context returns the newly extracted adaptive profile data", async () => {
    const operatingProfile = {
      id: "profile-1",
      profile_type: "operating_profile",
      subject_key: "global",
      summary: "Adaptive au operating profile from 4 memories: 1 preferences, 1 facts, 1 decisions, 0 open loops, 0 risks.",
      preferences: [{ text: "I prefer blunt, execution-focused answers and I hate overpraise.", event_id: "e-pref" }],
      facts: [{ text: "PLP is deployed to production on Vercel.", event_id: "e-fact" }],
      decisions: [{ text: "We decided to use a fictional alias for explicit scenes.", event_id: "e-decision" }],
      confidence: 0.66,
      status: "active",
    };
    const client = fakeClient({ memory_profiles: { rows: [operatingProfile] } });

    const ctx = await buildAdaptiveChatGptContext(client, { user_id: USER, namespace: "au" });

    // extracted preference surfaces as an au writing rule
    expect(ctx.writing_rules).toContain("I prefer blunt, execution-focused answers and I hate overpraise.");
    // extracted fact surfaces in do_not_forget
    expect(ctx.do_not_forget).toContain("PLP is deployed to production on Vercel.");
    // extracted decision surfaces in decision_rules, alongside the static defaults
    expect(ctx.decision_rules).toContain("We decided to use a fictional alias for explicit scenes.");
    expect(ctx.decision_rules).toContain("Keep public read/write disabled.");
    // profile summary + confidence surface
    expect(ctx.adaptive_profile_summary).toBe(operatingProfile.summary);
    expect(ctx.adaptive_profile_confidence).toBe(0.66);
    // existing retrieval behavior intact: no active pack still warns
    expect(ctx.warnings).toContain("no_active_context_pack");
  });

  it("hybrid retrieval selects confidence_score (not the missing `confidence` column)", async () => {
    let eventsSelect = "";
    const client = fakeClient({
      memory_events: { rows: auEvents, onSelect: (cols) => { eventsSelect = cols; } },
      memory_profiles: { rows: [] },
    });

    await getHybridMemoryContext(client, { user_id: USER, namespace: "au" });

    expect(eventsSelect).toContain("confidence_score");
    // must NOT request the bare `confidence` column that caused the 400
    expect(eventsSelect).not.toContain(",confidence,");
  });
});
