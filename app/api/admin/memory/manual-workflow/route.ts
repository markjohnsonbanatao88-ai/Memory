import { createOperatorManualMemoryWorkflowRouteHandler } from "@/lib/api/operator-manual-memory-workflow-route-handler";
const handler = createOperatorManualMemoryWorkflowRouteHandler();
export const GET = handler.GET;
export const POST = handler.POST;
