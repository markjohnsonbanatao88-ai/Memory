import type { RepositoryContext } from "@/lib/db/repository-context";
import type { MemoryReviewQueueItem } from "@/lib/services/memory-review-queue-contract";
import type { ApprovedReviewPersistencePreviewResult, ApprovedReviewItemPlan } from "@/lib/services/approved-review-memory-persistence-preview-contract";

export type ApprovedReviewPersistenceGateBlocker =
  | "missing_repository_context" | "missing_preview_plan" | "preview_must_be_no_write" | "future_internal_gate_required"
  | "env_flag_disabled" | "missing_internal_admin_capability" | "public_route_context" | "client_user_id_override_attempt"
  | "namespace_mismatch" | "append_only_required" | "not_approved_for_append";

export type ApprovedReviewPersistenceGateInput = {
  context?: RepositoryContext | null;
  item?: MemoryReviewQueueItem | null;
  preview?: ApprovedReviewPersistencePreviewResult | null;
  plan?: ApprovedReviewItemPlan | null;
  env?: { PANDORA_ENABLE_APPROVED_REVIEW_MEMORY_PERSISTENCE?: string };
  headers?: Headers | Record<string, string | undefined> | null;
  adminCapability?: "approved-review-executor" | boolean;
  routeContext?: "public" | "internal" | "test" | "admin";
  clientUserId?: string;
  client_user_id?: string;
  userId?: string;
  user_id?: string;
};
export type ApprovedReviewPersistenceGateResult = { allowed: boolean; blockers: ApprovedReviewPersistenceGateBlocker[]; warnings: string[]; productionRouteEnabled: false; publicRouteEnabled: false; appendOnly: true };

function header(input: ApprovedReviewPersistenceGateInput, name: string): string | undefined {
  if (!input.headers) return undefined;
  if (input.headers instanceof Headers) return input.headers.get(name) ?? undefined;
  return input.headers[name] ?? input.headers[name.toLowerCase()];
}

export function resolveApprovedReviewPersistenceGate(input: ApprovedReviewPersistenceGateInput): ApprovedReviewPersistenceGateResult {
  const blockers: ApprovedReviewPersistenceGateBlocker[] = [];
  const context = input.context;
  const item = input.item;
  const plan = input.plan ?? input.preview?.plans.find((p) => p.itemId === item?.id) ?? null;
  if (!context?.userId || !context.namespace) blockers.push("missing_repository_context");
  if (!input.preview || !plan) blockers.push("missing_preview_plan");
  if (input.preview && input.preview.wouldPersist !== false) blockers.push("preview_must_be_no_write");
  if (input.preview && input.preview.requiresFutureInternalGate !== true) blockers.push("future_internal_gate_required");
  if (input.env?.PANDORA_ENABLE_APPROVED_REVIEW_MEMORY_PERSISTENCE !== "true") blockers.push("env_flag_disabled");
  const hasCapability = input.adminCapability === true || input.adminCapability === "approved-review-executor" || header(input, "x-pandora-internal-persistence-mode") === "approved-review-executor";
  if (!hasCapability) blockers.push("missing_internal_admin_capability");
  if (!input.routeContext || input.routeContext === "public") blockers.push("public_route_context");
  if (input.clientUserId || input.client_user_id || input.userId || input.user_id) blockers.push("client_user_id_override_attempt");
  if (context && item && (context.userId !== item.userId || context.namespace !== item.namespace)) blockers.push("namespace_mismatch");
  if (plan && (!plan.source?.appendOnly || !plan.item?.appendOnly || !plan.patch?.appendOnly || plan.patch.operation !== "append" || !plan.auditLog?.appendOnly)) blockers.push("append_only_required");
  if (item && item.status !== "approved_for_append") blockers.push("not_approved_for_append");
  return { allowed: blockers.length === 0, blockers, warnings: [], productionRouteEnabled: false, publicRouteEnabled: false, appendOnly: true };
}
