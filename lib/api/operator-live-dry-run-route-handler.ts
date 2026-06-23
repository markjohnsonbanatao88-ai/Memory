import { NextResponse, type NextRequest } from "next/server";
import { assertNoClientUserIdOverride, resolvePandoraServerSession } from "@/lib/auth/pandora-server-session-resolver";
import { runOperatorLiveDryRun, type OperatorLiveDryRunRunnerDependencies } from "@/lib/services/operator-live-dry-run-runner";
import type { PandoraServerSessionResult } from "@/lib/auth/pandora-server-session-contract";

export type OperatorLiveDryRunRouteDependencies = Partial<OperatorLiveDryRunRunnerDependencies> & { sessionResolver?: (request: NextRequest) => Promise<PandoraServerSessionResult>; dryRunRunner?: typeof runOperatorLiveDryRun };
const minimal = { ok: false, dryRunOnly: true, blockers: [{ code: "auth_required", message: "Authenticated operator/admin session is required for detailed dry-run output." }], safety: { dryRunOnly: true, wouldWriteMemory: false, wouldPersistMemory: false, wouldCallModel: false, wouldEmbed: false, semanticRetrievalEnabled: false, publicPersistenceEnabled: false, publicIngestEnabled: false, publicReadEnabled: false, serviceRoleExposed: false }, secretsRedacted: true };
export function createOperatorLiveDryRunRouteHandler(deps: OperatorLiveDryRunRouteDependencies = {}) { return async function GET(request: NextRequest) {
  if (request.method !== "GET") return NextResponse.json({ ok: false, dryRunOnly: true, blockers: [{ code: "method_not_allowed", message: "Operator live dry-run is GET-only." }] }, { status: 405 });
  const rejected = await assertNoClientUserIdOverride(request); if (rejected) return NextResponse.json({ ...minimal, blockers: rejected.blockers }, { status: 400 });
  const namespace = new URL(request.url).searchParams.get("namespace");
  if (!namespace) return NextResponse.json({ ...minimal, blockers: [{ code: "namespace_required", message: "Namespace is required." }] }, { status: 400 });
  const sessionResult = await (deps.sessionResolver ?? ((req) => resolvePandoraServerSession({ request: req })))(request);
  if (!sessionResult.ok) return NextResponse.json(minimal, { status: 401 });
  const s = sessionResult.session; const allowed = s.isInternalOperator || s.isPersistenceOperator || s.adminCapabilities.includes("memory:live-dry-run") || s.adminCapabilities.includes("memory:readiness");
  if (!allowed) return NextResponse.json({ ...minimal, blockers: [{ code: "operator_capability_required", message: "Internal/admin/operator capability is required for detailed dry-run output." }] }, { status: 403 });
  const runner = deps.dryRunRunner ?? runOperatorLiveDryRun;
  const result = await runner({ namespace, serverSessionResolver: async () => sessionResult, runtimeSafetyConfigResolver: deps.runtimeSafetyConfigResolver, environmentSafetySnapshotBuilder: deps.environmentSafetySnapshotBuilder, operatorReadinessBuilder: deps.operatorReadinessBuilder, readRepository: deps.readRepository, readApiProbe: deps.readApiProbe, browserLoader: deps.browserLoader, deploymentChecklistGenerator: deps.deploymentChecklistGenerator });
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}; }
