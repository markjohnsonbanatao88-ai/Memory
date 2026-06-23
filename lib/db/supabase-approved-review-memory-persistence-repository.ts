import { repositoryError } from "@/lib/db/repository-result";
import type { RepositoryContext } from "@/lib/db/repository-context";
import type { ApprovedReviewMemoryPersistenceRepository } from "@/lib/db/approved-review-memory-persistence-repository-contract";
import type { PlannedAuditLogAppend, PlannedMemoryItemAppend, PlannedMemoryPatchAppend, PlannedMemorySourceAppend } from "@/lib/services/approved-review-memory-persistence-preview-contract";

/** Safe skeleton only. Future live writes must use a transactional RPC such as memory_execute_approved_review_persistence with RLS-safe server auth context. */
export class SupabaseApprovedReviewMemoryPersistenceRepository implements ApprovedReviewMemoryPersistenceRepository {
  constructor(private readonly client: unknown) { void this.client; }
  private notImplemented() { return Promise.resolve(repositoryError("database_error", "not_implemented: future RPC memory_execute_approved_review_persistence is required before live writes.")); }
  appendMemorySourceFromApprovedReview(context: RepositoryContext, plan: PlannedMemorySourceAppend) { void context; void plan; return this.notImplemented(); }
  appendMemoryItemFromApprovedReview(context: RepositoryContext, plan: PlannedMemoryItemAppend) { void context; void plan; return this.notImplemented(); }
  appendMemoryPatchFromApprovedReview(context: RepositoryContext, plan: PlannedMemoryPatchAppend) { void context; void plan; return this.notImplemented(); }
  appendAuditLogForApprovedReviewPersistence(context: RepositoryContext, plan: PlannedAuditLogAppend) { void context; void plan; return this.notImplemented(); }
  markReviewItemPersistencePreviewed(context: RepositoryContext, reviewItemId: string) { void context; void reviewItemId; return Promise.resolve(repositoryError("database_error", "not_implemented: review item execution marking must be part of memory_execute_approved_review_persistence.")); }
}
