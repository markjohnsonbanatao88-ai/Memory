import { repositoryError, repositoryOk, type RepositoryResult } from "@/lib/db/repository-result";
import type { RepositoryContext } from "@/lib/db/repository-context";
import type { ApprovedReviewMemoryPersistenceRepository, FutureApprovedReviewPersistenceRepositoryResult } from "@/lib/db/approved-review-memory-persistence-repository-contract";
import type { PlannedAuditLogAppend, PlannedMemoryItemAppend, PlannedMemoryPatchAppend, PlannedMemorySourceAppend } from "@/lib/services/approved-review-memory-persistence-preview-contract";

type AnyPlan = PlannedMemorySourceAppend | PlannedMemoryItemAppend | PlannedMemoryPatchAppend | PlannedAuditLogAppend;
function guard(context: RepositoryContext, plan: AnyPlan): RepositoryResult<true> {
  const userId = "userId" in plan ? plan.userId : "actorUserId" in plan ? plan.actorUserId : context.userId;
  const namespace = "namespace" in plan ? plan.namespace : context.namespace;
  if (namespace !== context.namespace) return repositoryError("namespace_mismatch", "Namespace mismatch rejected.");
  if (userId !== context.userId) return repositoryError("validation_failed", "User ID mismatch rejected.");
  if (!plan.appendOnly || ("operation" in plan && plan.operation !== "append")) return repositoryError("validation_failed", "Only append operations are allowed.");
  return repositoryOk(true);
}
export class InMemoryApprovedReviewMemoryPersistenceRepository implements ApprovedReviewMemoryPersistenceRepository {
  readonly sources: PlannedMemorySourceAppend[] = []; readonly items: PlannedMemoryItemAppend[] = []; readonly patches: PlannedMemoryPatchAppend[] = []; readonly auditLogs: PlannedAuditLogAppend[] = []; readonly markedReviewItems: string[] = []; readonly calls: string[] = [];
  private ok(id: string, context: RepositoryContext): RepositoryResult<FutureApprovedReviewPersistenceRepositoryResult> { return repositoryOk({ id, appendOnly: true, namespace: context.namespace, userIdFromContext: true, overwroteExistingMemory: false, deletedExistingMemory: false }); }
  async appendMemorySourceFromApprovedReview(context: RepositoryContext, plan: PlannedMemorySourceAppend) { this.calls.push("source"); const g = guard(context, plan); if (!g.ok) return g; this.sources.push({ ...plan }); return this.ok(`source-${this.sources.length}`, context); }
  async appendMemoryItemFromApprovedReview(context: RepositoryContext, plan: PlannedMemoryItemAppend) { this.calls.push("item"); const g = guard(context, plan); if (!g.ok) return g; this.items.push({ ...plan }); return this.ok(`item-${this.items.length}`, context); }
  async appendMemoryPatchFromApprovedReview(context: RepositoryContext, plan: PlannedMemoryPatchAppend) { this.calls.push("patch"); const g = guard(context, plan); if (!g.ok) return g; this.patches.push({ ...plan }); return this.ok(`patch-${this.patches.length}`, context); }
  async appendAuditLogForApprovedReviewPersistence(context: RepositoryContext, plan: PlannedAuditLogAppend) { this.calls.push("audit"); const g = guard(context, plan); if (!g.ok) return g; this.auditLogs.push({ ...plan }); return this.ok(`audit-${this.auditLogs.length}`, context); }
  async markReviewItemPersistencePreviewed(context: RepositoryContext, reviewItemId: string) { void context; this.calls.push("mark"); this.markedReviewItems.push(reviewItemId); return repositoryOk({ reviewItemId, previewedOnly: true as const, wouldPersist: false as const }); }
  readAllForTests() { return { sources: this.sources, items: this.items, patches: this.patches, auditLogs: this.auditLogs, markedReviewItems: this.markedReviewItems, calls: this.calls }; }
}
