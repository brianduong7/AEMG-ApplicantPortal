import { cookies } from "next/headers";
import {
  DEPARTMENT_MANAGER_COMPANY_COOKIE,
  DEPARTMENT_MANAGER_FRAPPE_COOKIE,
  RECRUITER_COMPANY_COOKIE,
  RECRUITER_FRAPPE_COOKIE,
  SESSION_COOKIE,
} from "@/lib/auth-constants";
import { erpnextGetLoggedUser } from "@/lib/applicant-erpnext-session";
import { parseCompanyId, type CompanyId } from "@/lib/companies";
import {
  fetchERPNextDeskRolesForSession,
  fetchERPNextDeskRolesForUser,
} from "@/lib/erpnext";
import {
  normalizeStaffErpRoles,
  staffErpRolesFromDeskAndProfileNames,
  type StaffErpRole,
} from "@/lib/staff-erp-roles";
import {
  parseSessionCookieJson,
  type SessionPayload,
} from "@/lib/session";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7,
};

export async function readStaffFrappeCookieHeader(): Promise<string | null> {
  const store = await cookies();
  const recruiter = store.get(RECRUITER_FRAPPE_COOKIE)?.value?.trim();
  if (recruiter) return recruiter;
  const dm = store.get(DEPARTMENT_MANAGER_FRAPPE_COOKIE)?.value?.trim();
  return dm || null;
}

export async function readStaffCompanyCookie(): Promise<CompanyId | null> {
  const store = await cookies();
  const recruiter = store.get(RECRUITER_COMPANY_COOKIE)?.value;
  const parsedRecruiter = parseCompanyId(
    typeof recruiter === "string" ? recruiter.trim() : recruiter,
  );
  if (parsedRecruiter) return parsedRecruiter;
  const dm = store.get(DEPARTMENT_MANAGER_COMPANY_COOKIE)?.value;
  return parseCompanyId(typeof dm === "string" ? dm.trim() : dm);
}

export async function setStaffFrappeSessionCookies(
  frappeCookieHeader: string,
  company: CompanyId,
): Promise<void> {
  const store = await cookies();
  store.set(RECRUITER_FRAPPE_COOKIE, frappeCookieHeader, COOKIE_OPTS);
  store.set(RECRUITER_COMPANY_COOKIE, company, COOKIE_OPTS);
  store.delete(DEPARTMENT_MANAGER_FRAPPE_COOKIE);
  store.delete(DEPARTMENT_MANAGER_COMPANY_COOKIE);
}

export async function setStaffSessionCookie(payload: SessionPayload): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, JSON.stringify(payload), COOKIE_OPTS);
}

async function mergeDeskRoleNames(
  email: string,
  frappeCookieHeader?: string | null,
): Promise<string[]> {
  const merged = new Set<string>();
  const cookie = frappeCookieHeader?.trim();
  if (cookie) {
    for (const r of await fetchERPNextDeskRolesForSession(cookie)) {
      merged.add(r);
    }
  }
  for (const r of await fetchERPNextDeskRolesForUser(email)) {
    merged.add(r);
  }
  return [...merged];
}

export async function resolveStaffErpRolesForUser(
  email: string,
  frappeCookieHeader?: string | null,
): Promise<StaffErpRole[]> {
  const deskNames = await mergeDeskRoleNames(email, frappeCookieHeader);
  const fromErp = staffErpRolesFromDeskAndProfileNames(deskNames);
  if (fromErp.length > 0) return fromErp;

  /** Do not fall back to a stale recruiter-only cookie when ERP returned role data. */
  if (frappeCookieHeader?.trim() && deskNames.length > 0) {
    return [];
  }

  const jar = await cookies();
  const parsed = parseSessionCookieJson(jar.get(SESSION_COOKIE)?.value);
  if (parsed?.staffRoles?.length) {
    return normalizeStaffErpRoles(parsed.staffRoles);
  }

  return [];
}

export async function resolveStaffSessionPayload(): Promise<SessionPayload | null> {
  const cookieHeader = await readStaffFrappeCookieHeader();
  const company = await readStaffCompanyCookie();
  if (!cookieHeader || !company) return null;

  const user = await erpnextGetLoggedUser(cookieHeader);
  if (!user) return null;

  const jar = await cookies();
  const parsed = parseSessionCookieJson(jar.get(SESSION_COOKIE)?.value);
  const fromErp = await resolveStaffErpRolesForUser(user, cookieHeader);
  let staffRoles = fromErp;
  if (staffRoles.length === 0) {
    const cookieRoles = parsed?.staffRoles?.length ?
      normalizeStaffErpRoles(parsed.staffRoles)
    : [];
    if (cookieRoles.includes("d_hr") || !cookieHeader) {
      staffRoles = cookieRoles;
    }
  }
  if (staffRoles.length === 0) {
    staffRoles = legacyStaffRolesFromPortal(parsed);
  }

  if (staffRoles.length === 0) return null;

  return {
    email: user,
    company,
    portal: "staff",
    staffRoles,
  };
}

function legacyStaffRolesFromPortal(parsed: SessionPayload | null): StaffErpRole[] {
  if (!parsed) return [];
  const roles: StaffErpRole[] = [];
  if (parsed.portal === "recruiter") roles.push("d_recruiter");
  if (parsed.portal === "department_manager") roles.push("d_department_manager");
  if (parsed.portal === "hr_portal") roles.push("d_hr");
  return roles;
}
