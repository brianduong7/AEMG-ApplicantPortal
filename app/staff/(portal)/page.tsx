import { redirect } from "next/navigation";
import { STAFF_PORTAL_BASE } from "@/lib/staff-portal-base";
import { staffRolesFromSession, staffUseScopedDepartmentManagerDataPlane } from "@/lib/staff-roles";
import { requireStaffSession } from "@/lib/staff-session";

export default async function StaffPortalHome() {
  const session = await requireStaffSession();
  const roles = staffRolesFromSession(session);
  if (staffUseScopedDepartmentManagerDataPlane(roles)) {
    redirect(`${STAFF_PORTAL_BASE}/job-requisitions`);
  }
  redirect(`${STAFF_PORTAL_BASE}/dashboard`);
}
