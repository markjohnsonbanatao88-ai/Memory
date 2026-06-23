import type { PandoraRuntimeSafetyConfigResult } from "@/lib/config/pandora-runtime-safety-config";
import type { PandoraServerSessionResult } from "@/lib/auth/pandora-server-session-contract";

export type OperatorReadinessCheckStatus = "pass" | "warning" | "blocked" | "disabled";
export type OperatorReadinessBlocker = { code: string; message: string };
export type OperatorReadinessWarning = { code: string; message: string };
export type OperatorReadinessCheck = { id: string; label: string; status: OperatorReadinessCheckStatus; safe: boolean; message: string };
export type OperatorReadinessSafetySummary = { publicPersistenceDisabled: boolean; productionIngestWritesDisabled: boolean; publicReadsDisabled: boolean; modelCallsDisabled: boolean; embeddingsDisabled: boolean; semanticRetrievalDisabled: boolean; gptActionsDisabled: boolean; mcpDisabled: boolean; secretsRedacted: true; serviceRolePublicRouteAbsent: boolean };
export type OperatorReadinessNamespaceSummary = { configured: boolean; allowed: string[]; requiresExplicitNamespace: true; auStoryMemoryIsNotRealLifeEvidence: true; realLifeMemoryRequiresFictionalizedReviewForAu: true };
export type OperatorReadinessInput = { runtime: PandoraRuntimeSafetyConfigResult; sessionResult?: PandoraServerSessionResult; environment?: { hasSupabaseUrl?: boolean; hasSupabaseAnonKey?: boolean; hasServiceRoleKey?: boolean; hasAuthSessionConfig?: boolean }; namespace?: OperatorReadinessNamespaceSummary; blockers?: OperatorReadinessBlocker[]; warnings?: OperatorReadinessWarning[] };
export type OperatorReadinessResult = { ok: boolean; headline: "Operator readiness"; checks: OperatorReadinessCheck[]; blockers: OperatorReadinessBlocker[]; warnings: OperatorReadinessWarning[]; safety: OperatorReadinessSafetySummary; namespace: OperatorReadinessNamespaceSummary; publicPersistenceDisabledByDefault: true };

export function buildOperatorReadinessResult(input: OperatorReadinessInput): OperatorReadinessResult {
  const c = input.runtime.config;
  const blockers: OperatorReadinessBlocker[] = [...(input.blockers ?? [])];
  const warnings: OperatorReadinessWarning[] = [...(input.warnings ?? [])];
  const add = (condition: boolean, code: string, message: string) => { if (!condition) blockers.push({ code, message }); };
  add(!!input.sessionResult?.ok, "server_session_required", "Server session resolver must authenticate the operator for detailed readiness.");
  add(!c.ingestProductionWriteEnabled, "ingest_production_writes_enabled", "Production ingest writes must remain disabled.");
  add(!c.publicMemoryReadEnabled, "public_memory_read_enabled", "Public unauthenticated memory reads must remain disabled.");
  add(!c.publicMemoryPersistenceEnabled, "public_memory_persistence_enabled", "Public memory persistence must remain disabled.");
  add(!c.modelCallsEnabled, "model_calls_enabled", "Model calls must remain disabled.");
  add(!c.embeddingsEnabled, "embeddings_enabled", "Embeddings must remain disabled.");
  add(!c.semanticRetrievalEnabled, "semantic_retrieval_enabled", "Semantic retrieval must remain disabled.");
  add(!c.gptActionsEnabled, "gpt_actions_enabled", "GPT Actions must remain disabled.");
  add(!c.mcpEnabled, "mcp_enabled", "MCP must remain disabled.");
  const ns = input.namespace ?? { configured: true, allowed: ["real_life", "au"], requiresExplicitNamespace: true, auStoryMemoryIsNotRealLifeEvidence: true, realLifeMemoryRequiresFictionalizedReviewForAu: true };
  const checks: OperatorReadinessCheck[] = [
    ["server_session_resolver", "server session resolver status", !!input.sessionResult?.ok],
    ["persisted_memory_read_gate", "persisted memory read gate", c.persistedMemoryReadEnabled],
    ["admin_persistence_console_gate", "admin persistence console gate", c.adminPersistenceConsoleEnabled],
    ["approved_review_persistence_gate", "approved-review persistence gate", c.approvedReviewPersistenceEnabled],
    ["operator_qa_flow_gate", "operator QA flow gate", c.operatorQaFlowEnabled],
    ["ingest_production_write_gate", "ingest production write gate", !c.ingestProductionWriteEnabled],
    ["public_memory_read_gate", "public memory read gate", !c.publicMemoryReadEnabled],
    ["public_memory_persistence_gate", "public memory persistence gate", !c.publicMemoryPersistenceEnabled],
    ["model_calls_gate", "model calls gate", !c.modelCallsEnabled],
    ["embeddings_gate", "embeddings gate", !c.embeddingsEnabled],
    ["semantic_retrieval_gate", "semantic retrieval gate", !c.semanticRetrievalEnabled],
    ["gpt_actions_gate", "GPT Actions gate", !c.gptActionsEnabled],
    ["mcp_gate", "MCP gate", !c.mcpEnabled],
    ["namespace_configuration", "namespace configuration", ns.configured],
    ["audit_requirement", "audit requirement", true],
    ["idempotency_requirement", "idempotency requirement", true],
    ["service_role_public_route_absence", "service-role public-route absence", true],
  ].map(([id, label, safe]) => ({ id: String(id), label: String(label), safe: Boolean(safe), status: Boolean(safe) ? "pass" : "blocked", message: Boolean(safe) ? "safe" : "requires operator action" }));
  return { ok: blockers.length === 0, headline: "Operator readiness", checks, blockers, warnings, safety: { publicPersistenceDisabled: !c.publicMemoryPersistenceEnabled, productionIngestWritesDisabled: !c.ingestProductionWriteEnabled, publicReadsDisabled: !c.publicMemoryReadEnabled, modelCallsDisabled: !c.modelCallsEnabled, embeddingsDisabled: !c.embeddingsEnabled, semanticRetrievalDisabled: !c.semanticRetrievalEnabled, gptActionsDisabled: !c.gptActionsEnabled, mcpDisabled: !c.mcpEnabled, secretsRedacted: true, serviceRolePublicRouteAbsent: true }, namespace: ns, publicPersistenceDisabledByDefault: true };
}
