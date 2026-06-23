import { createOperatorLiveDryRunRouteHandler } from "@/lib/api/operator-live-dry-run-route-handler";
const handler = createOperatorLiveDryRunRouteHandler();
export const dynamic = "force-dynamic";
export const GET = handler;
