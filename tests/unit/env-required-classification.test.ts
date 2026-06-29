import { describe, expect, it } from "vitest";
import { discoverEnvKeys, isRequiredProviderKey } from "@/lib/services/env-discovery-service";
import { buildEnvDriftReport } from "@/lib/services/env-drift-service";
import { classifyEnvKey } from "@/lib/services/env-validation-service";

// Regression lock for the Env Broker drift incident: feature flags / modes / tuning keys
// with safe runtime defaults must NOT be treated as required provider envs. Only real
// bootstrap secrets / provider requirements may trigger a RED missingInProvider.
describe("Env Broker required-provider rule (regression)", () => {
  const required = new Set(discoverEnvKeys().filter((i) => i.requiredSuggestion).map((i) => i.key));

  it("does not mark feature flags / modes / tuning keys as required provider envs", () => {
    const optionalSamples = [
      "PANDORA_ENABLE_GPT_ACTIONS", "PANDORA_ENABLE_MODEL_CALLS", "PANDORA_ENABLE_EMBEDDINGS",
      "PANDORA_ENABLE_SEMANTIC_RETRIEVAL", "PANDORA_ENABLE_MCP", "PANDORA_ENABLE_MEMORY_AUTOPILOT",
      "PANDORA_MEMORY_AUTOPILOT", "PANDORA_AUTO_RETRIEVE", "PANDORA_AUTO_CANDIDATE_QUEUE",
      "PANDORA_AUTO_CAPTURE_LOW_RISK", "PANDORA_EMBEDDING_MODEL", "PANDORA_MEMORY_EMBEDDING_DIMENSIONS",
      "PANDORA_VECTOR_INDEX_URL", "PANDORA_REDACT_BEFORE_EMBEDDING", "PANDORA_REDACT_BEFORE_MODEL_CALL",
      "PANDORA_SENSITIVE_MEMORY_REQUIRES_APPROVAL", "PANDORA_SKILLS_COMMIT_SHA", "PANDORA_SKILLS_PROOF_STATUS",
    ];
    for (const key of optionalSamples) {
      expect(isRequiredProviderKey(key)).toBe(false);
      expect(required.has(key)).toBe(false);
    }
  });

  it("treats only real bootstrap/provider requirements as required provider envs", () => {
    expect([...required].sort()).toEqual([
      "PANDORA_ENV_BROKER_ENABLED",
      "PANDORA_INTERNAL_JOB_TOKEN",
      "PANDORA_VERCEL_API_TOKEN",
    ]);
  });

  it("does not raise RED required-missing when the provider holds the bootstrap keys", async () => {
    const report = await buildEnvDriftReport({
      ok: true,
      envs: [
        { key: "PANDORA_INTERNAL_JOB_TOKEN", updatedAt: 1 },
        { key: "PANDORA_ENV_BROKER_ENABLED", updatedAt: 1 },
        { key: "PANDORA_VERCEL_API_TOKEN", updatedAt: 1 },
      ],
    });
    expect(report.missingInProvider).toEqual([]);
    expect(report.severity).not.toBe("red");
  });

  it("still flags a genuinely missing bootstrap secret as required-missing", async () => {
    const report = await buildEnvDriftReport({ ok: true, envs: [{ key: "PANDORA_ENV_BROKER_ENABLED", updatedAt: 1 }] });
    expect(report.missingInProvider).toContain("PANDORA_INTERNAL_JOB_TOKEN");
    expect(report.missingInProvider).toContain("PANDORA_VERCEL_API_TOKEN");
  });

  it("never classifies provider connection strings / secrets as public-safe", () => {
    for (const key of ["POSTGRES_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL_NON_POOLING"]) {
      expect(classifyEnvKey(key)).toBe("database_url");
    }
    expect(classifyEnvKey("POSTGRES_PASSWORD")).toBe("secret");
    expect(classifyEnvKey("SUPABASE_SECRET_KEY")).toBe("secret");
    expect(classifyEnvKey("SUPABASE_JWT_SECRET")).toBe("secret");
  });

  it("acknowledges provider integration + Vercel build metadata as managed (not unclassified)", () => {
    const catalog = new Map(discoverEnvKeys().map((i) => [i.key, i.classificationSuggestion]));
    for (const key of [
      "POSTGRES_URL", "POSTGRES_USER", "POSTGRES_HOST", "POSTGRES_DATABASE",
      "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_JWT_SECRET", "SUPABASE_SECRET_KEY", "VERCEL_GIT_COMMIT_TIMESTAMP",
    ]) {
      expect(catalog.get(key)).not.toBe("unknown");
      expect(catalog.has(key)).toBe(true);
    }
    expect(classifyEnvKey("VERCEL_GIT_COMMIT_TIMESTAMP")).toBe("public_safe");
  });
});
