import { NextResponse, type NextRequest } from "next/server";
import { createRepositoryContext, type RepositoryContext } from "@/lib/db/repository-context";
import type { MemoryReviewQueueRepository } from "@/lib/db/memory-review-queue-repository-contract";
import type { ApprovedReviewMemoryPersistenceRepository } from "@/lib/db/approved-review-memory-persistence-repository-contract";
import type { MemoryNamespace } from "@/lib/services/memory-extraction-contract";
import { previewApprovedReviewMemoryPersistence } from "@/lib/services/approved-review-memory-persistence-preview";
import { executeApprovedReviewMemoryPersistence } from "@/lib/services/approved-review-memory-persistence-executor";

export type ApprovedReviewMemoryPersistenceExecutorRouteDependencies = { resolveAuth?: (request: NextRequest) => Promise<Pick<RepositoryContext, "userId"> | null>; reviewQueueRepository?: MemoryReviewQueueRepository; persistenceRepository?: ApprovedReviewMemoryPersistenceRepository; env?: () => NodeJS.ProcessEnv; previewService?: typeof previewApprovedReviewMemoryPersistence; executorService?: typeof executeApprovedReviewMemoryPersistence; defaultNamespace?: MemoryNamespace; enabled?: boolean };
const disabled = { ok: false, executed: false, productionRouteEnabled: false, publicRouteEnabled: false, appendOnly: true, message: "approved-review memory persistence execution is disabled", blockers: ["disabled_by_default"] } as const;
function hasClientUserId(url: URL, body: Record<string, unknown>) { return url.searchParams.has("user_id") || url.searchParams.has("userId") || Boolean(body.user_id || body.userId || body.client_user_id || body.clientUserId); }
export function createApprovedReviewMemoryPersistenceExecutorRouteHandler(deps: ApprovedReviewMemoryPersistenceExecutorRouteDependencies = {}) {
  return async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>; const url = new URL(request.url);
    if (hasClientUserId(url, body)) return NextResponse.json({ ...disabled, blockers: ["client_user_id_override_attempt"] }, { status: 400 });
    if (!deps.enabled || !deps.resolveAuth || !deps.reviewQueueRepository || !deps.persistenceRepository) return NextResponse.json(disabled, { status: 501 });
    const auth = await deps.resolveAuth(request); const ctx = createRepositoryContext({ userId: auth?.userId ?? null, namespace: deps.defaultNamespace ?? "real_life", requestId: request.headers.get("x-request-id") ?? undefined });
    if (!ctx.ok) return NextResponse.json({ ...disabled, blockers: [ctx.error.code], message: ctx.error.message }, { status: 401 });
    const { id } = await params; const item = await deps.reviewQueueRepository.readReviewQueueItemById(ctx.data, id);
    if (!item.ok) return NextResponse.json({ ...disabled, blockers: [item.error.code], message: item.error.message }, { status: item.error.code === "not_found" ? 404 : 400 });
    const preview = (deps.previewService ?? previewApprovedReviewMemoryPersistence)({ context: ctx.data, items: [item.data] });
    const result = await (deps.executorService ?? executeApprovedReviewMemoryPersistence)({ context: ctx.data, item: item.data, preview, repository: deps.persistenceRepository, env: { PANDORA_ENABLE_APPROVED_REVIEW_MEMORY_PERSISTENCE: (deps.env?.() ?? process.env).PANDORA_ENABLE_APPROVED_REVIEW_MEMORY_PERSISTENCE }, headers: request.headers, routeContext: "internal" });
    return NextResponse.json(result, { status: result.executed ? 200 : 403 });
  };
}
