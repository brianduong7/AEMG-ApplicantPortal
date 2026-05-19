import { cookies } from "next/headers";
import { resolveApplicantSessionPayload } from "@/lib/applicant-erpnext-session";
import { SESSION_COOKIE } from "@/lib/auth-constants";
import { parseCompanyId, type CompanyId } from "@/lib/companies";
import { resolveDepartmentManagerSessionPayload } from "@/lib/department-manager-erpnext-session";
import { resolveRecruiterSessionPayload } from "@/lib/recruiter-erpnext-session";
import { resolveStaffSessionPayload } from "@/lib/staff-erpnext-session";
import {
  normalizeStaffErpRoles,
  type StaffErpRole,
} from "@/lib/staff-erp-roles";

export type PortalKind =
  | "applicant"
  | "recruiter"
  | "department_manager"
  | "hr_portal"
  | "staff";

export type SessionPayload = {
  email: string;
  company: CompanyId;
  /** When unset, the session is treated as the applicant portal (backwards compatible). */
  portal?: PortalKind;
  /** Desk roles from ERPNext (`D-Recruiter`, etc.) after unified staff login. */
  staffRoles?: StaffErpRole[];
};

function normalizePortal(raw: unknown): PortalKind | undefined {
  if (
    raw === "recruiter" ||
    raw === "applicant" ||
    raw === "department_manager" ||
    raw === "hr_portal" ||
    raw === "staff"
  ) {
    return raw;
  }
  /** Renamed portal: old session value → HR portal. */
  if (raw === "hiring_manager") return "hr_portal";
  /** Legacy cookie value from when the route was `/hr` (meant recruiter, not the HR portal). */
  if (raw === "hr") return "recruiter";
  return undefined;
}

export function parseSessionCookieJson(raw: string | undefined): SessionPayload | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as {
      email?: unknown;
      company?: unknown;
      portal?: unknown;
      staffRoles?: unknown;
    };
    if (typeof data.email !== "string" || !data.email) return null;
    const company = parseCompanyId(data.company);
    if (!company) return null;
    const portal = normalizePortal(data.portal);
    const staffRoles = normalizeStaffErpRoles(data.staffRoles);
    return {
      email: data.email,
      company,
      portal,
      staffRoles: staffRoles.length ? staffRoles : undefined,
    };
  } catch {
    return null;
  }
}

export function isRecruiterPortal(session: SessionPayload): boolean {
  return session.portal === "recruiter";
}

export function isDepartmentManagerPortal(session: SessionPayload): boolean {
  return session.portal === "department_manager";
}

/** Distinct HR portal (policies, org HR) — not the legacy `portal: "hr"` cookie which maps to recruiter. */
export function isHrPortal(session: SessionPayload): boolean {
  return session.portal === "hr_portal";
}

export function isApplicantPortal(session: SessionPayload): boolean {
  return session.portal === "applicant" || session.portal === undefined;
}

export function isStaffPortal(session: SessionPayload): boolean {
  return session.portal === "staff";
}

export function isStaffPortalSession(session: SessionPayload): boolean {
  return (
    isStaffPortal(session) ||
    isRecruiterPortal(session) ||
    isDepartmentManagerPortal(session) ||
    isHrPortal(session)
  );
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  const parsed = parseSessionCookieJson(raw ?? undefined);

  /** Demo / legacy applicant JSON session takes precedence over a stray recruiter Frappe cookie. */
  if (parsed && isApplicantPortal(parsed)) {
    return parsed;
  }

  /** Live staff session: refresh desk roles from ERPNext (User name + Has Role + Role Profile). */
  const staff = await resolveStaffSessionPayload();
  if (staff) return staff;

  if (parsed && isStaffPortal(parsed) && parsed.staffRoles?.length) {
    return parsed;
  }

  if (
    parsed &&
    (isRecruiterPortal(parsed) ||
      isDepartmentManagerPortal(parsed) ||
      isHrPortal(parsed))
  ) {
    return parsed;
  }

  const recruiter = await resolveRecruiterSessionPayload();
  /** Unified staff login stores the Frappe jar on recruiter cookies — do not force `d_recruiter`. */
  if (recruiter && parsed?.portal !== "staff") {
    return {
      email: recruiter.email,
      company: recruiter.company,
      portal: "staff",
      staffRoles: ["d_recruiter"],
    };
  }

  const departmentManager = await resolveDepartmentManagerSessionPayload();
  if (departmentManager) {
    return {
      email: departmentManager.email,
      company: departmentManager.company,
      portal: "staff",
      staffRoles: ["d_department_manager"],
    };
  }

  const applicant = await resolveApplicantSessionPayload();
  if (applicant) return applicant;

  return parsed;
}
