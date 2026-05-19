import { NextResponse } from "next/server";
import { erpnextGetLoggedUser } from "@/lib/applicant-erpnext-session";
import {
  readStaffCompanyCookie,
  readStaffFrappeCookieHeader,
  resolveStaffErpRolesForUser,
  setStaffSessionCookie,
} from "@/lib/staff-erpnext-session";
import { getSession, isStaffPortalSession } from "@/lib/session";

/** Refresh `SESSION_COOKIE` staff roles from ERPNext (allowed in Route Handlers). */
export async function POST() {
  const session = await getSession();
  if (!session || !isStaffPortalSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const frappeCookie = await readStaffFrappeCookieHeader();
  const company = await readStaffCompanyCookie();
  if (!frappeCookie || !company) {
    return NextResponse.json({ error: "Missing staff session." }, { status: 400 });
  }

  const user = await erpnextGetLoggedUser(frappeCookie);
  if (!user) {
    return NextResponse.json({ error: "Invalid Frappe session." }, { status: 401 });
  }

  const staffRoles = await resolveStaffErpRolesForUser(user, frappeCookie);
  if (staffRoles.length === 0) {
    return NextResponse.json(
      { error: "No recruitment roles found for this user in ERPNext." },
      { status: 403 },
    );
  }

  await setStaffSessionCookie({
    email: user,
    company,
    portal: "staff",
    staffRoles,
  });

  return NextResponse.json({ ok: true, staffRoles });
}
