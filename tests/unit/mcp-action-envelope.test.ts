/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";
import { runMcpAction, capActionPayload, classifyActionError, MCP_ACTION_MAX_PAYLOAD_CHARS } from "@/lib/services/pandora-mcp-action-envelope";

function parse(result: { content: Array<{ type: "text"; text: string }> }) {
  expect(result.content).toHaveLength(1);
  expect(result.content[0].type).toBe("text");
  // must always be valid JSON, never HTML / stack / empty
  return JSON.parse(result.content[0].text) as Record<string, any>;
}

describe("MCP action envelope (roadmap #9)", () => {
  it("wraps a successful tool result with request_id and preserves its fields", async () => {
    const body = await parse(await runMcpAction(async () => ({ namespace: "au", context_pack: { title: "t" }, warnings: ["existing"] })));
    expect(body.ok).toBe(true);
    expect(body.fallback_used).toBe(false);
    expect(body.request_id).toMatch(/^req_/);
    expect(body.namespace).toBe("au");
    expect(body.context_pack.title).toBe("t");
    expect(body.warnings).toContain("existing");
  });

  it("turns a thrown internal error into controlled JSON with error_code + request_id, no stack", async () => {
    const body = await parse(
      await runMcpAction(async () => {
        throw new Error("context_read_failed: boom\n    at deep (file.ts:10:5)");
      }),
    );
    expect(body.ok).toBe(false);
    expect(body.error_code).toBe("context_read_failed");
    expect(body.request_id).toMatch(/^req_/);
    expect(typeof body.message).toBe("string");
    expect(body.message).not.toContain("\n"); // stack collapsed to a single safe line
    expect(body.message.length).toBeLessThanOrEqual(300);
  });

  it("turns a timeout into controlled JSON", async () => {
    const body = await parse(await runMcpAction(() => new Promise(() => {}), { timeoutMs: 20 }));
    expect(body.ok).toBe(false);
    expect(body.error_code).toBe("action_timeout");
    expect(body.request_id).toMatch(/^req_/);
  });

  it("uses the fallback path and marks fallback_used=true when the primary fails", async () => {
    const body = await parse(
      await runMcpAction(
        async () => {
          throw new Error("context_read_failed: primary down");
        },
        { fallback: async () => ({ context_pack: { id: "fallback-pack" } }) },
      ),
    );
    expect(body.ok).toBe(true);
    expect(body.fallback_used).toBe(true);
    expect(body.context_pack.id).toBe("fallback-pack");
    expect(body.warnings).toContain("primary_failed:context_read_failed");
  });

  it("returns a controlled error when both primary and fallback fail", async () => {
    const body = await parse(
      await runMcpAction(
        async () => {
          throw new Error("primary_failed: x");
        },
        {
          fallback: async () => {
            throw new Error("fallback_failed: y");
          },
        },
      ),
    );
    expect(body.ok).toBe(false);
    expect(body.request_id).toMatch(/^req_/);
    expect(body.error_code).toBe("primary_failed");
  });

  it("enforces a payload cap at the action boundary", async () => {
    const huge = { items: Array.from({ length: 5000 }, (_, i) => `row-${i}-${"x".repeat(20)}`) };
    const capped = capActionPayload(huge, 2000);
    expect(JSON.stringify(capped).length).toBeLessThanOrEqual(2000);

    const body = await parse(await runMcpAction(async () => huge, { maxPayloadChars: 2000 }));
    expect(body.ok).toBe(true);
    expect(JSON.stringify(body).length).toBeLessThanOrEqual(2000);
  });

  it("does not leak secrets in error messages", () => {
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const classified = classifyActionError(new Error(`context_read_failed: apikey ${jwt} rejected`));
    expect(classified.message).not.toContain(jwt);
    expect(classified.message).toContain("[REDACTED_SECRET]");
    expect(classified.error_code).toBe("context_read_failed");
  });

  it("has a sane default payload budget", () => {
    expect(MCP_ACTION_MAX_PAYLOAD_CHARS).toBeGreaterThan(0);
  });
});
