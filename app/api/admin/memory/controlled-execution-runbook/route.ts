import { createControlledOperatorExecutionRunbookRouteHandler } from "@/lib/api/controlled-operator-execution-runbook-route-handler";
const handler = createControlledOperatorExecutionRunbookRouteHandler();
export const GET = handler.GET;
export const POST = handler.POST;
