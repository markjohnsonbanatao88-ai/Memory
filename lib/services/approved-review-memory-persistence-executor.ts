import { resolveApprovedReviewPersistenceGate } from "@/lib/services/approved-review-memory-persistence-gate";
import type { ApprovedReviewMemoryPersistenceExecutorInput, ApprovedReviewMemoryPersistenceExecutorResult } from "@/lib/services/approved-review-memory-persistence-executor-contract";

export async function executeApprovedReviewMemoryPersistence(input: ApprovedReviewMemoryPersistenceExecutorInput): Promise<ApprovedReviewMemoryPersistenceExecutorResult> {
  const plan = input.plan ?? input.preview.plans.find((p) => p.itemId === input.item.id);
  const base = { productionRouteEnabled: false as const, publicRouteEnabled: false as const, appendOnly: true as const, namespace: input.context.namespace, userId: input.context.userId, requestHash: input.requestHash, fingerprint: input.fingerprint, idempotencyKey: input.idempotencyKey };
  const gate = resolveApprovedReviewPersistenceGate({ ...input, plan });
  if (!gate.allowed || !plan?.source || !plan.item || !plan.patch || !plan.auditLog) return { ...base, executed: false, counts: { sources: 0, items: 0, patches: 0, auditLogs: 0, markedReviewItems: 0, blocked: 1, failed: 0 }, blockers: gate.blockers, warnings: gate.warnings, blocked: { kind: "blocked", blockers: gate.blockers, reason: "approved-review memory persistence execution blocked by internal gate" } };
  async function step<T extends { id: string }>(name: string, fn: () => Promise<{ ok: true; data: T } | { ok: false; error: { message: string } }>) { const result = await fn(); if (!result.ok) throw new Error(`${name}: ${result.error.message}`); return result.data; }
  try {
    const source = await step("memory_source_append", () => input.repository.appendMemorySourceFromApprovedReview(input.context, plan.source!));
    const item = await step("memory_item_append", () => input.repository.appendMemoryItemFromApprovedReview(input.context, plan.item!));
    const patch = await step("memory_patch_append", () => input.repository.appendMemoryPatchFromApprovedReview(input.context, plan.patch!));
    const audit = await step("audit_log_append", () => input.repository.appendAuditLogForApprovedReviewPersistence(input.context, plan.auditLog!));
    await step("mark_review_item_persistence_executed", () => input.repository.markReviewItemPersistencePreviewed(input.context, input.item.id).then((r) => r.ok ? { ok: true, data: { id: r.data.reviewItemId } } : r));
    return { ...base, executed: true, counts: { sources: 1, items: 1, patches: 1, auditLogs: 1, markedReviewItems: 1, blocked: 0, failed: 0 }, blockers: [], warnings: [], source: { kind: "memory_source_append", id: source.id, appendOnly: true }, item: { kind: "memory_item_append", id: item.id, appendOnly: true }, patch: { kind: "memory_patch_append", id: patch.id, appendOnly: true }, auditLog: { kind: "audit_log_append", id: audit.id, appendOnly: true } };
  } catch (error) {
    return { ...base, executed: false, counts: { sources: 0, items: 0, patches: 0, auditLogs: 0, markedReviewItems: 0, blocked: 0, failed: 1 }, blockers: [], warnings: [], failure: { kind: "transaction_failure", failedStep: String(error instanceof Error ? error.message.split(":")[0] : "unknown"), message: error instanceof Error ? error.message : "unknown failure", rollbackRequired: true, committed: false } };
  }
}
