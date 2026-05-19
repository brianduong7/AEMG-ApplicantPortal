import {
  readStaffFrappeCookieHeader,
  resolveStaffErpRolesForUser,
} from "@/lib/staff-erpnext-session";
import type { SessionPayload } from "@/lib/session";
import {
  isDepartmentManagerPortal,
  isHrPortal,
  isRecruiterPortal,
  isStaffPortal,
} from "@/lib/session";
import {
  normalizeStaffErpRoles,
  staffErpRoleLabels,
  staffPortalRolesAllow,
  type StaffErpRole,
  type StaffPortalRole,
} from "@/lib/staff-erp-roles";

export type { StaffPortalRole };
export { staffPortalRolesAllow as staffRolesAllow };

function superAdminEmailSet(): Set<string> {
  const raw = process.env.ATS_SUPER_ADMIN_EMAILS?.trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function emailIsSuperAdmin(email: string): boolean {
  return superAdminEmailSet().has(email.trim().toLowerCase());
}

function legacyRolesFromPortal(session: SessionPayload): StaffErpRole[] {
  const roles: StaffErpRole[] = [];
  if (isRecruiterPortal(session)) roles.push("d_recruiter");
  if (isDepartmentManagerPortal(session)) roles.push("d_department_manager");
  if (isHrPortal(session)) roles.push("d_hr");
  return roles;
}

/**
 * Roles for navigation and route guards. Prefer ERPNext desk roles on the session; fall back to
 * legacy portal kind when migrating older cookies.
 */
export function staffRolesFromSession(session: SessionPayload): StaffPortalRole[] {
  const fromCookie = normalizeStaffErpRoles(session.staffRoles);
  const roles: StaffPortalRole[] =
    fromCookie.length > 0 ? [...fromCookie] : [...legacyRolesFromPortal(session)];

  if (emailIsSuperAdmin(session.email) && !roles.includes("super_admin")) {
    roles.unshift("super_admin");
  }
  return roles;
}

export function staffPortalSubtitle(
  _session: SessionPayload,
  roles: StaffPortalRole[],
): string {
  if (roles.includes("super_admin")) return "Super admin";
  const erpOnly = roles.filter((r): r is StaffErpRole => r !== "super_admin");
  if (erpOnly.length === 0) return "Staff";
  return staffErpRoleLabels(erpOnly);
}

export function staffHasRecruiterCapabilities(roles: StaffPortalRole[]): boolean {
  return staffPortalRolesAllow(roles, ["d_recruiter", "super_admin"]);
}

export function staffHasHrCapabilities(roles: StaffPortalRole[]): boolean {
  return staffPortalRolesAllow(roles, ["d_hr", "super_admin"]);
}

/**
 * Submit, amend, or send job offers. Requires the HR desk role explicitly — not granted to
 * recruiters-only, even when legacy allow-lists or super-admin nav bypass would apply elsewhere.
 */
export function staffCanApproveJobOffers(roles: StaffPortalRole[]): boolean {
  if (roles.includes("super_admin")) return true;
  return roles.includes("d_hr");
}

/** Fresh desk roles for permission checks (prefer live ERP data over stale session cookie). */
export async function getEffectiveStaffPortalRoles(
  session: SessionPayload,
): Promise<StaffPortalRole[]> {
  const frappeCookie = await readStaffFrappeCookieHeader();
  let roles: StaffPortalRole[] = [];
  if (frappeCookie) {
    roles = await resolveStaffErpRolesForUser(session.email, frappeCookie);
  }
  if (roles.length === 0) {
    roles = normalizeStaffErpRoles(session.staffRoles);
  }
  if (emailIsSuperAdmin(session.email) && !roles.includes("super_admin")) {
    return ["super_admin", ...roles];
  }
  return roles;
}

/** Resolve live ERP roles, then check job-offer approval permission. */
export async function staffCanApproveJobOffersForSession(
  session: SessionPayload,
): Promise<boolean> {
  const roles = await getEffectiveStaffPortalRoles(session);
  return staffCanApproveJobOffers(roles);
}

export function staffHasExecutiveCapabilities(roles: StaffPortalRole[]): boolean {
  return staffPortalRolesAllow(roles, ["d_executive", "super_admin"]);
}

export function staffHasDepartmentManagerCapabilities(roles: StaffPortalRole[]): boolean {
  return staffPortalRolesAllow(roles, ["d_department_manager", "super_admin"]);
}

/** Department managers may create requisitions; recruiters may only view approved ones. */
export function staffCanCreateJobRequisitions(roles: StaffPortalRole[]): boolean {
  if (staffHasRecruiterCapabilities(roles)) return false;
  return staffHasDepartmentManagerCapabilities(roles);
}

/** Scoped DM data when the user is only a department manager (not recruiter/HR/executive). */
export function staffUseScopedDepartmentManagerDataPlane(roles: StaffPortalRole[]): boolean {
  if (roles.includes("super_admin")) return false;
  const wide = staffPortalRolesAllow(roles, ["d_recruiter", "d_hr", "d_executive"]);
  return staffHasDepartmentManagerCapabilities(roles) && !wide;
}

export function isUnifiedStaffSession(session: SessionPayload): boolean {
  return isStaffPortal(session) || normalizeStaffErpRoles(session.staffRoles).length > 0;
}
