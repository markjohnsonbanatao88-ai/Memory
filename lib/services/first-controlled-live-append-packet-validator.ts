import type { FirstControlledLiveAppendPacketBlocker, FirstControlledLiveAppendPacketInput, FirstControlledLiveAppendPacketResult } from "@/lib/services/first-controlled-live-append-packet-contract";
const raw = /memoryText|evidenceText|rawSourceBody|rawEnv|secret|service-role|service_role|SUPABASE_SERVICE_ROLE|rawErrors|stack|raw error/i;
const b = (code: string, message = code): FirstControlledLiveAppendPacketBlocker => ({ code, message, redacted: true });
export function validateFirstControlledLiveAppendPacket(input: FirstControlledLiveAppendPacketInput): FirstControlledLiveAppendPacketResult {
  const blockers: FirstControlledLiveAppendPacketBlocker[] = []; const s = input.sessionResult?.ok ? input.sessionResult.session : null; const reviewIds = input.reviewItemIds ?? (input.reviewItemId ? [input.reviewItemId] : []); const decisionIds = input.decisionIds ?? (input.decisionId ? [input.decisionId] : []);
  if (!input.sessionResult?.ok) blockers.push(b("missing_session"));
  if (!s?.authenticated) blockers.push(b("missing_authenticated_operator"));
  if (!s?.isInternalOperator && !s?.isPersistenceOperator && !s?.adminCapabilities?.includes("memory:first-live-append") && !s?.adminCapabilities?.includes("memory:manual-workflow")) blockers.push(b("missing_operator_capability"));
  if (!input.namespace) blockers.push(b("missing_namespace"));
  if (input.namespace && !(input.allowedNamespaces ?? s?.allowedNamespaces ?? []).includes(input.namespace as never)) blockers.push(b("namespace_not_allowed"));
  if (input.user_id || input.userId) blockers.push(b("client_user_id_rejected"));
  if (reviewIds.length === 0) blockers.push(b("missing_review_item")); if (reviewIds.length > 1) blockers.push(b("multiple_review_items"));
  if (!input.reviewItemApprovedForAppend && input.reviewItemStatus !== "approved" && input.reviewItemStatus !== "approved_for_append") blockers.push(b("review_item_not_approved"));
  if (decisionIds.length === 0) blockers.push(b("missing_decision")); if (decisionIds.length > 1) blockers.push(b("multiple_decisions"));
  if (input.decisionType && input.decisionType !== "approve_append") blockers.push(b("decision_not_approve_append"));
  if (!input.decisionReviewItemId || input.decisionReviewItemId !== input.reviewItemId) blockers.push(b("decision_review_item_mismatch"));
  if (!input.preview) blockers.push(b("missing_preview")); if (input.preview && !input.preview.eligible) blockers.push(b("preview_ineligible")); if (!input.preview?.fingerprint) blockers.push(b("missing_preview_fingerprint"));
  if (!input.idempotencyKey) blockers.push(b("missing_idempotency_key")); if (!input.idempotencyFingerprint) blockers.push(b("missing_idempotency_fingerprint")); if (input.typedConfirmation !== "APPEND MEMORY") blockers.push(b("typed_confirmation_mismatch"));
  if (!input.readinessLock) blockers.push(b("missing_readiness_lock")); else if (!input.readinessLock.ready) blockers.push(b("readiness_not_ready")); if (input.readinessLock?.emergencyStop.enabled) blockers.push(b("emergency_stop_on"));
  if (!input.runbookValidation) blockers.push(b("missing_runbook_validation")); else if (input.runbookValidation.ok === false || input.runbookValidation.status === "failed") blockers.push(b("runbook_validation_failed"));
  for (const [key, code] of [["proofCaptureAvailable","proof_capture_unavailable"],["readbackVerifierAvailable","readback_verifier_unavailable"],["browserVerifierAvailable","browser_verifier_unavailable"],["auditVerifierAvailable","audit_verifier_unavailable"]] as const) if (input[key] !== true) blockers.push(b(code));
  for (const [key, code] of [["publicPersistenceEnabled","public_persistence_enabled"],["productionIngestEnabled","production_ingest_enabled"],["publicReadEnabled","public_read_enabled"],["modelCallsEnabled","model_calls_enabled"],["embeddingsEnabled","embeddings_enabled"],["semanticRetrievalEnabled","semantic_retrieval_enabled"],["gptActionsEnabled","gpt_actions_enabled"],["mcpEnabled","mcp_enabled"],["serviceRoleExposureDetected","service_role_exposure_detected"]] as const) if (input[key]) blockers.push(b(code));
  const text = JSON.stringify({ packetContent: input.packetContent, preview: input.preview, rawErrors: input.rawErrors }); if (raw.test(text)) blockers.push(b("unsafe_raw_content_detected"));
  return { ok: blockers.length === 0, blockers, warnings: [] };
}
