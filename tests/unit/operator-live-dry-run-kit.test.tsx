import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import type { PersistedMemoryReadRepository } from "@/lib/db/persisted-memory-read-repository-contract";
import { runOperatorLiveDryRun } from "@/lib/services/operator-live-dry-run-runner";
import { probePersistedMemoryReadApis } from "@/lib/services/operator-read-api-probe";
import { createOperatorLiveDryRunRouteHandler } from "@/lib/api/operator-live-dry-run-route-handler";
import Page from "@/app/admin/memory/live-dry-run/page";
import fs from "node:fs";
import path from "node:path";

const session = { ok: true as const, session: { userId: "u1", authenticated: true, allowedNamespaces: ["real_life" as const, "au" as const], adminCapabilities: ["memory:live-dry-run"], isInternalOperator: true, isPersistenceOperator: false, sessionSource: "test" as const, serverDerivedOnly: true as const, clientUserIdAccepted: false as const, publicReadAllowed: false as const, publicPersistenceAllowed: false as const, serviceRoleUsed: false as const }, blockers: [] };
const runtime = { config: { persistedMemoryReadEnabled: true, adminPersistenceConsoleEnabled: false, approvedReviewPersistenceEnabled: false, operatorQaFlowEnabled: false, ingestProductionWriteEnabled: false, publicMemoryReadEnabled: false, publicMemoryPersistenceEnabled: false, modelCallsEnabled: false, embeddingsEnabled: false, semanticRetrievalEnabled: false, gptActionsEnabled: false, mcpEnabled: false }, gates: {} as never };
function repo(items: Array<Record<string, unknown>> = []): PersistedMemoryReadRepository { return { listMemoryItems: vi.fn(async () => ({ ok: true, items, page: 1, pageSize: 1, total: items.length, readOnly: true, wouldWrite: false, wouldCallModel: false, wouldEmbed: false, semanticRetrievalEnabled: false, requiresAuth: true, namespaceScoped: true })), getMemoryItemDetail: vi.fn(async (_c, r) => ({ ok: true, item: items[0] ?? { id: r.id, namespace: "real_life", readOnly: true, wouldWrite: false, wouldCallModel: false, wouldEmbed: false, semanticRetrievalEnabled: false, requiresAuth: true, namespaceScoped: true, sensitiveEvidenceRedacted: true, auStoryMemoryIsNotRealLifeEvidence: true }, readOnly: true, wouldWrite: false, wouldCallModel: false, wouldEmbed: false, semanticRetrievalEnabled: false, requiresAuth: true, namespaceScoped: true })), listMemorySources: vi.fn(async () => ({ ok: true, items: [], page: 1, pageSize: 1, readOnly: true, wouldWrite: false, wouldCallModel: false, wouldEmbed: false, semanticRetrievalEnabled: false, requiresAuth: true, namespaceScoped: true })), getMemorySourceDetail: vi.fn(), listMemoryPatches: vi.fn(async () => ({ ok: true, items: [], page: 1, pageSize: 1, readOnly: true, wouldWrite: false, wouldCallModel: false, wouldEmbed: false, semanticRetrievalEnabled: false, requiresAuth: true, namespaceScoped: true })), listMemoryAuditEvents: vi.fn(async () => ({ ok: true, items: [], page: 1, pageSize: 1, readOnly: true, wouldWrite: false, wouldCallModel: false, wouldEmbed: false, semanticRetrievalEnabled: false, requiresAuth: true, namespaceScoped: true })) }; }
const deps = (r = repo()) => ({ namespace: "real_life", serverSessionResolver: vi.fn(async () => session), runtimeSafetyConfigResolver: vi.fn(() => runtime), environmentSafetySnapshotBuilder: vi.fn(() => ({ secretsRedacted: true, serviceRoleKey: "[redacted]" })), readRepository: r, browserLoader: vi.fn(async (input) => ({ items: [], blockers: [], readOnly: input.readOnly, detail: null, sources: [], patches: [], auditEvents: [], filters: {}, empty: true })) });

describe("operator live dry-run kit", () => {
  it("rejects client user_id/userId, requires server session and namespace", async () => {
    expect((await runOperatorLiveDryRun({ ...deps(), user_id: "evil" })).blockers.some((b) => b.code === "client_user_id_rejected")).toBe(true);
    expect((await runOperatorLiveDryRun({ ...deps(), serverSessionResolver: vi.fn(async () => ({ ok: false, session: null, blockers: [] })) })).blockers.some((b) => b.code === "auth_required")).toBe(true);
    expect((await runOperatorLiveDryRun({ ...deps(), namespace: undefined })).blockers.some((b) => b.code === "namespace_required")).toBe(true);
  });
  it("consumes runtime config/environment and uses injected read repo/browser read-only without executors", async () => {
    const d = deps(); const result = await runOperatorLiveDryRun(d);
    expect(d.runtimeSafetyConfigResolver).toHaveBeenCalled(); expect(d.environmentSafetySnapshotBuilder).toHaveBeenCalled(); expect(d.readRepository.listMemoryItems).toHaveBeenCalled(); expect(d.browserLoader).toHaveBeenCalledWith(expect.objectContaining({ readOnly: true }));
    expect(result.qa.persistenceExecutorCalled).toBe(false); expect(result.qa.previewExecutorCalled).toBe(false); expect(result.qa.ingestCalled).toBe(false);
  });
  it("read API probe returns ready_empty and ready_with_data", async () => {
    expect((await probePersistedMemoryReadApis({ context: { userId: "u1", namespace: "real_life" }, namespace: "real_life", repository: repo() })).summary.status).toBe("ready_empty");
    const item = { id: "m1", namespace: "real_life", readOnly: true, wouldWrite: false, wouldCallModel: false, wouldEmbed: false, semanticRetrievalEnabled: false, requiresAuth: true, namespaceScoped: true, sensitiveEvidenceRedacted: true, auStoryMemoryIsNotRealLifeEvidence: true };
    expect((await probePersistedMemoryReadApis({ context: { userId: "u1", namespace: "real_life" }, namespace: "real_life", repository: repo([item]) })).summary.status).toBe("ready_with_data");
  });
  it("route is GET-only, blocks unauthenticated detail, rejects client user id, and redacts secrets", async () => {
    const handler = createOperatorLiveDryRunRouteHandler({ sessionResolver: vi.fn(async () => ({ ok: false, session: null, blockers: [] })) });
    expect((await handler(new NextRequest("http://x/api?namespace=real_life", { method: "POST" }))).status).toBe(405);
    expect((await handler(new NextRequest("http://x/api?namespace=real_life"))).status).toBe(401);
    expect((await handler(new NextRequest("http://x/api?namespace=real_life&user_id=e"))).status).toBe(400);
    const ok = createOperatorLiveDryRunRouteHandler({ sessionResolver: vi.fn(async () => session), dryRunRunner: vi.fn(async () => ({ ok: true, secret: "[redacted]", blockers: [], warnings: [], secretsRedacted: true })) });
    const body = await (await ok(new NextRequest("http://x/api?namespace=real_life"))).json(); expect(JSON.stringify(body)).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
  it("UI renders dry-run safety copy and dangerous gate statuses", () => {
    const html = renderToStaticMarkup(React.createElement(Page));
    expect(html).toContain("Dry-run only"); expect(html).toContain("No memory writes are performed"); expect(html).toContain("public persistence"); expect(html).toContain("production ingest writes"); expect(html).toContain("semantic retrieval");
  });
  it("env template contains no real secrets and forbidden imports/features are absent from new public dry-run route", () => {
    const tmpl = fs.readFileSync(path.join(process.cwd(), "docs/templates/operator-safe-live-env.example.md"), "utf8");
    expect(tmpl).toContain("<public-anon-key-placeholder>"); expect(tmpl).not.toContain("sk-"); expect(tmpl).toContain("PANDORA_ENABLE_MCP=false");
    const route = fs.readFileSync(path.join(process.cwd(), "app/api/admin/memory/live-dry-run/route.ts"), "utf8");
    expect(route).not.toMatch(/service-role|openai|pgvector|vector|retrieval|GPT Actions|MCP/i);
  });
  it("keeps existing ingest, public persistence, memory browser, and QA boundaries safe", () => {
    const ingestRoute = fs.readFileSync(path.join(process.cwd(), "app/api/memory/ingest/route.ts"), "utf8");
    const persistRoute = fs.readFileSync(path.join(process.cwd(), "app/api/memory/review/[id]/persist/route.ts"), "utf8");
    const browserLoader = fs.readFileSync(path.join(process.cwd(), "lib/services/persisted-memory-browser-loader.ts"), "utf8");
    const qaRoute = fs.readFileSync(path.join(process.cwd(), "app/api/admin/memory/qa-flow/route.ts"), "utf8");
    expect(ingestRoute).toContain("createMemoryIngestRouteHandler");
    expect(persistRoute).toContain("public_route_disabled_by_default");
    expect(browserLoader).toContain("read-only memory browser");
    expect(qaRoute).toContain("enabled: false");
  });

});
