import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function POST() {
  return NextResponse.json({ ok: false, executed: false, productionRouteEnabled: false, publicRouteEnabled: false, appendOnly: true, message: "approved-review memory persistence execution is disabled", blockers: ["public_route_disabled_by_default", "internal_admin_gate_required"] }, { status: 501 });
}
