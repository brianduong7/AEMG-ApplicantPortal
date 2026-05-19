import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  DEPARTMENT_MANAGER_FRAPPE_COOKIE,
  RECRUITER_FRAPPE_COOKIE,
  SESSION_COOKIE,
} from "@/lib/auth-constants";
import { getSession, isStaffPortalSession } from "@/lib/session";
import { STAFF_PORTAL_BASE } from "@/lib/staff-portal-base";
import { staffRolesAllow, type StaffPortalRole } from "@/lib/staff-portal-role";
import {
  staffRolesFromSession,
  staffUseScopedDepartmentManagerDataPlane,
} from "@/lib/staff-roles";

export async function requireStaffSession() {
  const session = await getSession();
  const ok = session && isStaffPortalSession(session);
  if (!ok) {
    const jar = await cookies();
    const hasRecruiterJar = Boolean(jar.get(RECRUITER_FRAPPE_COOKIE)?.value?.trim());
    const hasDmJar = Boolean(jar.get(DEPARTMENT_MANAGER_FRAPPE_COOKIE)?.value?.trim());
    const hasSessionCookie = Boolean(jar.get(SESSION_COOKIE)?.value?.trim());
    const q = new URLSearchParams();
    if (hasRecruiterJar || hasDmJar || hasSessionCookie) {
      q.set("staleSession", "1");
    }
    const qs = q.toString();
    redirect(qs ? `${STAFF_PORTAL_BASE}/login?${qs}` : `${STAFF_PORTAL_BASE}/login`);
  }
  return session;
}

export async function requireStaffRoles(allowed: readonly StaffPortalRole[]) {
  const session = await requireStaffSession();
  const roles = staffRolesFromSession(session);
  if (!staffRolesAllow(roles, allowed)) {
    const fallback =
      staffUseScopedDepartmentManagerDataPlane(roles) ?
        `${STAFF_PORTAL_BASE}/job-requisitions`
      : `${STAFF_PORTAL_BASE}/dashboard`;
    redirect(fallback);
  }
  return { session, roles };
}
