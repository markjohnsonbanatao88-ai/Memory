import type { RepositoryContext } from "@/lib/db/repository-context";
import type { ApprovedReviewMemoryPersistenceRepository } from "@/lib/db/approved-review-memory-persistence-repository-contract";
import type { MemoryReviewQueueItem } from "@/lib/services/memory-review-queue-contract";
import type { ApprovedReviewItemPlan, ApprovedReviewPersistencePreviewResult } from "@/lib/services/approved-review-memory-persistence-preview-contract";
import type { ApprovedReviewPersistenceGateBlocker, ApprovedReviewPersistenceGateInput } from "@/lib/services/approved-review-memory-persistence-gate";

export type ApprovedReviewMemoryPersistenceExecutorInput = ApprovedReviewPersistenceGateInput & { context: RepositoryContext; item: MemoryReviewQueueItem; preview: ApprovedReviewPersistencePreviewResult; plan?: ApprovedReviewItemPlan; repository: ApprovedReviewMemoryPersistenceRepository; requestHash?: string; fingerprint?: string; idempotencyKey?: string };
export type ExecutedMemorySourceAppendResult = { kind: "memory_source_append"; id: string; appendOnly: true };
export type ExecutedMemoryItemAppendResult = { kind: "memory_item_append"; id: string; appendOnly: true };
export type ExecutedMemoryPatchAppendResult = { kind: "memory_patch_append"; id: string; appendOnly: true };
export type ExecutedAuditLogAppendResult = { kind: "audit_log_append"; id: string; appendOnly: true };
export type SkippedOrBlockedOperationResult = { kind: "blocked" | "skipped"; blockers: ApprovedReviewPersistenceGateBlocker[]; reason: string };
export type RollbackTransactionFailureResult = { kind: "transaction_failure"; failedStep: string; message: string; rollbackRequired: true; committed: false };
export type ApprovedReviewPersistenceExecutionSummaryDto = { sources: number; items: number; patches: number; auditLogs: number; markedReviewItems: number; blocked: number; failed: number };
export type ApprovedReviewMemoryPersistenceExecutorResult = {
  executed: boolean; productionRouteEnabled: false; publicRouteEnabled: false; appendOnly: true; namespace: string; userId: string;
  counts: ApprovedReviewPersistenceExecutionSummaryDto; blockers: string[]; warnings: string[]; requestHash?: string; fingerprint?: string; idempotencyKey?: string;
  source?: ExecutedMemorySourceAppendResult; item?: ExecutedMemoryItemAppendResult; patch?: ExecutedMemoryPatchAppendResult; auditLog?: ExecutedAuditLogAppendResult;
  blocked?: SkippedOrBlockedOperationResult; failure?: RollbackTransactionFailureResult;
};
