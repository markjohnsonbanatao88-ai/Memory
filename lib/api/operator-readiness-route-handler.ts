import { NextResponse, type NextRequest } from "next/server";
import { resolvePandoraRuntimeSafetyConfig } from "@/lib/config/pandora-runtime-safety-config";
import { buildPandoraEnvironmentSafetySnapshot } from "@/lib/config/pandora-environment-safety-snapshot";
import { resolvePandoraServerSession } from "@/lib/auth/pandora-server-session-resolver";
import { validateOperatorRuntimeGates } from "@/lib/services/operator-runtime-gate-validator";
import { buildOperatorReadinessResult } from "@/lib/services/operator-readiness-contract";
import type { PandoraServerSessionResult } from "@/lib/auth/pandora-server-session-contract";

export type OperatorReadinessRouteDependencies = { env?: () => Partial<NodeJS.ProcessEnv>; sessionResolver?: (request: NextRequest) => Promise<PandoraServerSessionResult>; runtimeGateValidator?: typeof validateOperatorRuntimeGates; environmentSafetySnapshotBuilder?: typeof buildPandoraEnvironmentSafetySnapshot };
const minimal = { ok: false, headline: "Operator readiness", publicPersistenceDisabledByDefault: true, safety: { publicPersistenceDisabled: true, productionIngestWritesDisabled: true, modelCallsDisabled: true, embeddingsDisabled: true, semanticRetrievalDisabled: true, secretsRedacted: true }, blockers: [{ code: "auth_required", message: "Authenticated operator session is required for detailed readiness." }] };
export function createOperatorReadinessRouteHandler(deps: OperatorReadinessRouteDependencies = {}) {
  return async function handler(request: NextRequest) {
    if (request.method !== "GET") return NextResponse.json({ ok: false, readOnly: true, blockers: [{ code: "method_not_allowed", message: "Readiness endpoint is GET-only and read-only." }] }, { status: 405 });
    const env = deps.env?.() ?? process.env; const runtime = resolvePandoraRuntimeSafetyConfig(env); const snapshot = (deps.environmentSafetySnapshotBuilder ?? buildPandoraEnvironmentSafetySnapshot)(env);
    const sessionResult = await (deps.sessionResolver ?? ((req) => resolvePandoraServerSession({ request: req })))(request);
    if (!sessionResult.ok) return NextResponse.json(minimal, { status: 401 });
    const session = sessionResult.session; const allowed = session.isInternalOperator || session.isPersistenceOperator || session.adminCapabilities.includes("memory:readiness");
    if (!allowed) return NextResponse.json({ ...minimal, blockers: [{ code: "operator_capability_required", message: "Internal/admin/operator capability is required for detailed readiness." }] }, { status: 403 });
    const validation = (deps.runtimeGateValidator ?? validateOperatorRuntimeGates)(runtime);
    const result = buildOperatorReadinessResult({ runtime, sessionResult, environment: { hasSupabaseUrl: snapshot.supabase.publicUrlConfigured, hasSupabaseAnonKey: snapshot.supabase.anonKeyConfigured, hasServiceRoleKey: snapshot.supabase.serviceRoleKeyPresent, hasAuthSessionConfig: snapshot.requiredEnv.authSessionConfig }, blockers: validation.blockers, warnings: validation.warnings });
    return NextResponse.json({ ...result, environment: snapshot, readOnly: true, message: "Public persistence is disabled by default. Secrets are never displayed." });
  };
}
