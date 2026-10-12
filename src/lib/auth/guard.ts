// NovaMart - Server-Side Role Guards for API Routes
// Centralizes the staff/admin authorization checks so every sensitive route
// enforces the same rule. Demo clients always send the `novamart_user_email`
// cookie (same-origin fetch), so legitimate workspace flows are unaffected.
//
// Usage:
//   const gate = await requireStaff(req);
//   if ("response" in gate) return gate.response;
//   // ... gate.session is a staff session here

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "./session";
import type { SessionUser } from "@/types";

export type StaffSession = SessionUser & { role: "SUPPORT_AGENT" | "ADMIN" };
export type AdminSession = SessionUser & { role: "ADMIN" };

type GateResult<T> = { session: T } | { response: NextResponse };

function forbidden(message: string): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

function sessionEmail(req: NextRequest): string | undefined {
  try {
    return req.cookies.get("novamart_user_email")?.value;
  } catch {
    return undefined;
  }
}

// Allow support agents and admins (agent inbox, tickets, conversation takeover).
export async function requireStaff(req: NextRequest): Promise<GateResult<StaffSession>> {
  const session = await getSessionUser(sessionEmail(req));
  if (!session || (session.role !== "SUPPORT_AGENT" && session.role !== "ADMIN")) {
    return { response: forbidden("Forbidden. Agent or Admin required.") };
  }
  return { session: session as StaffSession };
}

// Admin console only (analytics, emails, settings, dispatch, knowledge writes).
export async function requireAdmin(req: NextRequest): Promise<GateResult<AdminSession>> {
  const session = await getSessionUser(sessionEmail(req));
  if (!session || session.role !== "ADMIN") {
    return { response: forbidden("Forbidden. Admin required.") };
  }
  return { session: session as AdminSession };
}
