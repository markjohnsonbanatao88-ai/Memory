import { buildAllFirstReviewedMemoryFixtures } from "../lib/services/first-reviewed-memory-fixture-builder";
import { runManualWorkflowFixtureHarness } from "../lib/services/operator-manual-workflow-fixture-harness";

async function main() {
  console.log("TEST-ONLY FIXTURE HARNESS");
  console.log("NO PRODUCTION WRITES");
  console.log("NO MODEL CALLS");
  console.log("NO SEMANTIC RETRIEVAL");
  const results = [];
  for (const fixture of buildAllFirstReviewedMemoryFixtures()) {
    const result = await runManualWorkflowFixtureHarness({ fixture });
    results.push(result);
    console.log(`${result.ok ? "PASS" : "FAIL"} ${result.scenario} blocked=${result.expectedBlocked} productionSeed=${result.safeSummary.productionSeed} publicPersistence=${result.safeSummary.publicPersistenceEnabled}`);
  }
  if (results.some((r) => !r.ok)) process.exit(1);
}
main().catch(() => { console.error("FAIL fixture harness error (redacted)"); process.exit(1); });
