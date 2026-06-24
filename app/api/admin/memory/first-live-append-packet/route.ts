import { createFirstControlledLiveAppendPacketRouteHandler } from "@/lib/api/first-controlled-live-append-packet-route-handler";
const handler = createFirstControlledLiveAppendPacketRouteHandler();
export const GET = handler.GET;
export const POST = handler.POST;
