import { redactSecrets } from "@/lib/services/memory-redaction-service";

// Roadmap #9 — action error hardening.
// Wraps every Pandora MCP tool call in a controlled envelope so an action never returns
// HTML, stack traces, empty/malformed JSON, giant payloads, secrets, or raw error objects.

export const MCP_ACTION_TIMEOUT_MS = 10_000;
export const MCP_ACTION_MAX_PAYLOAD_CHARS = 24_000;

export type McpActionContent = { content: Array<{ type: "text"; text: string }> };

function newRequestId(): string {
  return `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function jsonLength(value: unknown): number {
  try {
    return JSON.stringify(value)?.length ?? 0;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

class ActionTimeoutError extends Error {
  constructor(ms: number) {
    super(`action_timeout: exceeded ${ms}ms time budget`);
    this.name = "ActionTimeoutError";
  }
}

export async function withActionTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new ActionTimeoutError(ms)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// Turn any thrown value into a safe { error_code, message } — never a stack trace, secret, or raw object.
export function classifyActionError(error: unknown): { error_code: string; message: string } {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "internal_error";
  const safe = redactSecrets(String(raw)).replace(/\s+/g, " ").trim().slice(0, 300) || "internal_error";
  const match = /^([a-z][a-z0-9_]{2,60}):/i.exec(safe);
  return { error_code: match ? match[1].toLowerCase() : "internal_error", message: safe };
}

// Deterministically shrink a payload under a char budget by trimming the largest fields first.
export function capActionPayload<T>(value: T, maxChars: number = MCP_ACTION_MAX_PAYLOAD_CHARS): T {
  if (jsonLength(value) <= maxChars) return value;
  if (Array.isArray(value)) {
    let arr = value as unknown[];
    while (arr.length > 1 && jsonLength(arr) > maxChars) arr = arr.slice(0, Math.ceil(arr.length / 2));
    return arr as unknown as T;
  }
  if (value && typeof value === "object") {
    const obj: Record<string, unknown> = { ...(value as Record<string, unknown>) };
    const keysBySize = Object.keys(obj).sort((a, b) => jsonLength(obj[b]) - jsonLength(obj[a]));
    for (const key of keysBySize) {
      if (jsonLength(obj) <= maxChars) break;
      obj[key] = capActionPayload(obj[key], Math.max(200, Math.floor(maxChars / 3)));
    }
    if (jsonLength(obj) > maxChars) {
      obj.truncated = true;
      obj.warnings = [...(Array.isArray(obj.warnings) ? (obj.warnings as unknown[]) : []), "payload_capped_at_action_boundary"];
    }
    return obj as T;
  }
  if (typeof value === "string") return value.slice(0, maxChars) as unknown as T;
  return value;
}

function toContent(data: unknown): McpActionContent {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function mergeEnvelope(
  data: unknown,
  envelope: { request_id: string; fallback_used: boolean; extraWarnings?: string[] },
): Record<string, unknown> {
  const extra = envelope.extraWarnings ?? [];
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    const warnings = [...extra, ...(Array.isArray(obj.warnings) ? (obj.warnings as unknown[]) : [])];
    // Spread the tool result so its own fields (including a controlled ok:false gate) win.
    return { ok: true, request_id: envelope.request_id, fallback_used: envelope.fallback_used, ...obj, warnings };
  }
  return { ok: true, request_id: envelope.request_id, fallback_used: envelope.fallback_used, warnings: extra, data };
}

export async function runMcpAction(
  fn: () => Promise<unknown>,
  opts: { fallback?: () => Promise<unknown>; timeoutMs?: number; maxPayloadChars?: number } = {},
): Promise<McpActionContent> {
  const request_id = newRequestId();
  const timeoutMs = opts.timeoutMs ?? MCP_ACTION_TIMEOUT_MS;
  const maxPayloadChars = opts.maxPayloadChars ?? MCP_ACTION_MAX_PAYLOAD_CHARS;
  try {
    const data = await withActionTimeout(Promise.resolve().then(fn), timeoutMs);
    return toContent(capActionPayload(mergeEnvelope(data, { request_id, fallback_used: false }), maxPayloadChars));
  } catch (primaryError) {
    const primary = classifyActionError(primaryError);
    if (opts.fallback) {
      try {
        const fallbackData = await withActionTimeout(Promise.resolve().then(opts.fallback), timeoutMs);
        return toContent(
          capActionPayload(
            mergeEnvelope(fallbackData, { request_id, fallback_used: true, extraWarnings: [`primary_failed:${primary.error_code}`] }),
            maxPayloadChars,
          ),
        );
      } catch {
        // fall through to controlled error envelope
      }
    }
    return toContent({ ok: false, request_id, error_code: primary.error_code, message: primary.message, fallback_used: false, warnings: [] });
  }
}
