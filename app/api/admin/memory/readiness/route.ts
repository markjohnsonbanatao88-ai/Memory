import { createOperatorReadinessRouteHandler } from "@/lib/api/operator-readiness-route-handler";
const handler = createOperatorReadinessRouteHandler();
export const dynamic = "force-dynamic";
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
