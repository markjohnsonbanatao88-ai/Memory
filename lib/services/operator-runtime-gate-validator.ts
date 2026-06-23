import type { PandoraRuntimeSafetyConfigResult } from "@/lib/config/pandora-runtime-safety-config";
import type { OperatorReadinessBlocker, OperatorReadinessWarning } from "@/lib/services/operator-readiness-contract";
export function validateOperatorRuntimeGates(input: PandoraRuntimeSafetyConfigResult): { ok: boolean; blockers: OperatorReadinessBlocker[]; warnings: OperatorReadinessWarning[] } {
  const c = input.config; const blockers: OperatorReadinessBlocker[] = []; const warnings: OperatorReadinessWarning[] = [];
  const blockIf = (v: boolean, code: string, message: string) => { if (v) blockers.push({ code, message }); };
  blockIf(c.ingestProductionWriteEnabled, "ingest_production_write_enabled", "Production ingest writes must stay disabled.");
  blockIf(c.publicMemoryReadEnabled, "public_read_enabled", "Public memory reads require future explicit safety documentation and are disabled now.");
  blockIf(c.publicMemoryPersistenceEnabled, "public_persistence_enabled", "Public memory persistence is disabled by default.");
  blockIf(c.modelCallsEnabled, "model_calls_enabled", "Model calls are outside this phase.");
  blockIf(c.embeddingsEnabled, "embeddings_enabled", "Embeddings are outside this phase.");
  blockIf(c.semanticRetrievalEnabled, "semantic_retrieval_enabled", "Semantic retrieval is outside this phase.");
  blockIf(c.gptActionsEnabled, "gpt_actions_enabled", "GPT Actions are outside this phase.");
  blockIf(c.mcpEnabled, "mcp_enabled", "MCP is outside this phase.");
  if (c.approvedReviewPersistenceEnabled && !c.adminPersistenceConsoleEnabled) blockers.push({ code: "persistence_without_admin_gate", message: "Persistence execution requires admin/internal gate." });
  if (c.operatorQaFlowEnabled && (!c.adminPersistenceConsoleEnabled || !c.approvedReviewPersistenceEnabled)) warnings.push({ code: "operator_qa_requires_explicit_gates", message: "Operator QA flow requires explicit admin and approved-review persistence env flags." });
  return { ok: blockers.length === 0, blockers, warnings };
}
