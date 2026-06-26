import { describe, expect, it } from "vitest";
import { resolvePandoraMcpPrincipal } from "@/lib/services/mcp-auth";

function req(token?: string) { return new Request("https://example.test/api/mcp", { headers: token ? { authorization: `Bearer ${token}` } : {} }); }
const env = { PANDORA_ENABLE_MCP: "true", PANDORA_MCP_TOKEN: "secret-token", PANDORA_MCP_USER_ID: "user-1", PANDORA_MCP_DB_KEY: "db-key" };

describe("Pandora MCP auth", () => {
  it("blocks when MCP is disabled", () => {
    const result = resolvePandoraMcpPrincipal(req("secret-token"), { ...env, PANDORA_ENABLE_MCP: "false" });
    expect(result).toMatchObject({ ok: false, code: "mcp_disabled", status: 403 });
  });
  it("rejects missing token", () => {
    const result = resolvePandoraMcpPrincipal(req(), env);
    expect(result).toMatchObject({ ok: false, code: "mcp_token_missing", status: 401 });
  });
  it("rejects wrong token", () => {
    const result = resolvePandoraMcpPrincipal(req("wrong-token"), env);
    expect(result).toMatchObject({ ok: false, code: "mcp_token_invalid", status: 401 });
  });
  it("resolves a correct bearer principal", () => {
    const result = resolvePandoraMcpPrincipal(req("secret-token"), env);
    expect(result).toEqual({ ok: true, authType: "mcp_bearer_token", userId: "user-1" });
  });
});
