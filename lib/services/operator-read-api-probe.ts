import type { PersistedMemoryReadRepository } from "@/lib/db/persisted-memory-read-repository-contract";
import type { PersistedMemoryNamespace, PersistedMemoryReadContext } from "@/lib/services/persisted-memory-read-contract";
import type { OperatorLiveDryRunBlocker, OperatorLiveDryRunReadApiSummary, OperatorLiveDryRunWarning } from "@/lib/services/operator-live-dry-run-contract";

export type OperatorReadApiProbeInput = { context?: Partial<PersistedMemoryReadContext>; namespace?: string | null; repository?: PersistedMemoryReadRepository };
export type OperatorReadApiProbeResult = { ok: boolean; summary: OperatorLiveDryRunReadApiSummary; blockers: OperatorLiveDryRunBlocker[]; warnings: OperatorLiveDryRunWarning[] };
const blocked = (code: string, message: string): OperatorReadApiProbeResult => ({ ok: false, summary: { status: "blocked", itemCount: 0, detailChecked: false, sourcesChecked: false, patchesChecked: false, auditChecked: false, readOnly: true }, blockers: [{ code, step: "persisted_read_api_readiness_checked", message }], warnings: [] });
const isNs = (v?: string | null): v is PersistedMemoryNamespace => v === "real_life" || v === "au";
export async function probePersistedMemoryReadApis(input: OperatorReadApiProbeInput): Promise<OperatorReadApiProbeResult> {
  if (!input.context?.userId) return blocked("auth_required", "Server-derived repository context is required.");
  if (!isNs(input.namespace)) return blocked("namespace_required", "Namespace is required for read API probes.");
  if (input.context.namespace && input.context.namespace !== input.namespace) return blocked("namespace_mismatch", "Namespace must match server-derived repository context.");
  if (!input.repository) return blocked("repository_unavailable", "Persisted-memory read repository is unavailable.");
  const context = { userId: input.context.userId, namespace: input.namespace };
  try {
    const list = await input.repository.listMemoryItems(context, { namespace: input.namespace, pageSize: 1 });
    if (!list.ok) return blocked(list.blocker.code, list.blocker.message);
    const first = list.items[0];
    const detail = first ? await input.repository.getMemoryItemDetail(context, { namespace: input.namespace, id: first.id }) : null;
    if (detail && !detail.ok) return blocked(detail.blocker.code, detail.blocker.message);
    const filter = first ? { itemId: first.id } : undefined;
    const [sources, patches, audit] = await Promise.all([input.repository.listMemorySources(context, { namespace: input.namespace, filter }), input.repository.listMemoryPatches(context, { namespace: input.namespace, filter }), input.repository.listMemoryAuditEvents(context, { namespace: input.namespace, filter })]);
    for (const r of [sources, patches, audit]) if (!r.ok) return blocked(r.blocker.code, r.blocker.message);
    const itemCount = list.total ?? list.items.length;
    return { ok: true, summary: { status: itemCount > 0 ? "ready_with_data" : "ready_empty", itemCount, detailChecked: !!first, sourcesChecked: true, patchesChecked: true, auditChecked: true, readOnly: true }, blockers: [], warnings: itemCount === 0 ? [{ code: "empty_memory_ok", step: "persisted_read_api_readiness_checked", message: "Empty memory is acceptable for first setup if read APIs are healthy." }] : [] };
  } catch { return blocked("read_probe_failed", "Persisted-memory read API probe failed safely."); }
}
