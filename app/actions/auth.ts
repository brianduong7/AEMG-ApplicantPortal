"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  clearApplicantFrappeSessionCookies,
  erpnextLoginWithPassword,
  erpnextLogoutWithCookie,
  setApplicantFrappeSessionCookies,
} from "@/lib/applicant-erpnext-session";
import {
  APPLICANT_COMPANY_COOKIE,
  APPLICANT_FRAPPE_COOKIE,
  DEPARTMENT_MANAGER_COMPANY_COOKIE,
  DEPARTMENT_MANAGER_FRAPPE_COOKIE,
  RECRUITER_COMPANY_COOKIE,
  RECRUITER_FRAPPE_COOKIE,
  SESSION_COOKIE,
} from "@/lib/auth-constants";
import { parseCompanyId, RECRUITER_PORTAL_DEFAULT_COMPANY } from "@/lib/companies";
import {
  getERPNextSiteBaseUrl,
  registerERPNextRecruiterDeskUser,
  registerERPNextWebsiteUserAndCandidate,
} from "@/lib/erpnext";
import {
  clearDepartmentManagerFrappeSessionCookies,
  setDepartmentManagerFrappeSessionCookies,
} from "@/lib/department-manager-erpnext-session";
import {
  clearRecruiterFrappeSessionCookies,
  setRecruiterFrappeSessionCookies,
} from "@/lib/recruiter-erpnext-session";
import {
  fetchERPNextDeskRolesForSession,
  fetchERPNextDeskRolesForUser,
} from "@/lib/erpnext";
import {
  ERP_STAFF_ROLE_NAMES,
  staffErpRolesFromDeskAndProfileNames,
  type StaffErpRole,
} from "@/lib/staff-erp-roles";
import {
  setStaffFrappeSessionCookies,
  setStaffSessionCookie,
} from "@/lib/staff-erpnext-session";
import {
  isDepartmentManagerPortal,
  isHrPortal,
  isRecruiterPortal,
  isStaffPortalSession,
  parseSessionCookieJson,
  type SessionPayload,
} from "@/lib/session";

export type AuthFormState = { error?: string } | null;

export type RegisterFormState = { error?: string } | null;

function legacyJobsPathToApplicant(path: string): string | null {
  if (path === "/jobs" || path === "/jobs/") return "/applicant/jobs";
  if (path === "/jobs/dashboard") return "/applicant/dashboard";
  if (path === "/jobs/applications") return "/applicant/applications";
  if (path === "/jobs/profile") return "/applicant/profile";
  const m = /^\/jobs\/([^/]+)\/apply\/?$/.exec(path);
  if (m) return `/applicant/jobs/${m[1]}/apply`;
  return null;
}

function safeReturnToPath(raw: string): string | null {
  const path = raw.trim();
  if (path.startsWith("//") || path.includes("://")) return null;
  if (
    path.startsWith("/applicant/") &&
    !path.startsWith("/applicant/login")
  ) {
    return path;
  }
  return legacyJobsPathToApplicant(path);
}

function safeStaffReturnToPath(raw: string): string | null {
  const path = raw.trim();
  if (!path.startsWith("/staff")) return null;
  if (path.startsWith("/staff/login")) return null;
  if (path.startsWith("//") || path.includes("://")) return null;
  return path;
}

function safeRecruiterReturnToPath(raw: string): string | null {
  const path = raw.trim();
  if (!path.startsWith("/recruiter")) return null;
  if (path.startsWith("/recruiter/login") || path.startsWith("/recruiter/register")) return null;
  if (path.startsWith("//") || path.includes("://")) return null;
  const tail = path.slice("/recruiter".length);
  return tail === "" || tail === "/" ? "/staff/dashboard" : `/staff${tail}`;
}

function recruiterEmailIsAllowed(email: string): boolean {
  const raw =
    process.env.ATS_RECRUITER_ALLOWED_EMAILS?.trim() ?? process.env.ATS_HR_ALLOWED_EMAILS?.trim();
  if (!raw) return true;
  const allowed = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

function safeDepartmentManagerReturnToPath(raw: string): string | null {
  const path = raw.trim();
  if (!path.startsWith("/department-manager")) return null;
  if (path.startsWith("/department-manager/login")) return null;
  if (path.startsWith("//") || path.includes("://")) return null;
  const tail = path.slice("/department-manager".length);
  return tail === "" || tail === "/" ? "/staff/dashboard" : `/staff${tail}`;
}

function safeHrPortalReturnToPath(raw: string): string | null {
  const path = raw.trim();
  if (!path.startsWith("/hr-portal")) return null;
  if (path.startsWith("/hr-portal/login")) return null;
  if (path.startsWith("//") || path.includes("://")) return null;
  const tail = path.slice("/hr-portal".length);
  return tail === "" || tail === "/" ? "/staff/dashboard" : `/staff${tail}`;
}

function staffReturnToPath(raw: string): string | null {
  return (
    safeStaffReturnToPath(raw) ??
    safeRecruiterReturnToPath(raw) ??
    safeDepartmentManagerReturnToPath(raw) ??
    safeHrPortalReturnToPath(raw)
  );
}

function departmentManagerEmailIsAllowed(email: string): boolean {
  const raw = process.env.ATS_DEPARTMENT_MANAGER_ALLOWED_EMAILS?.trim();
  if (!raw) return true;
  const allowed = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

function hrPortalEmailIsAllowed(email: string): boolean {
  const raw = process.env.ATS_HR_PORTAL_ALLOWED_EMAILS?.trim();
  if (!raw) return false;
  const allowed = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

function staffRolesFromAllowLists(email: string): StaffErpRole[] {
  const roles: StaffErpRole[] = [];
  if (recruiterEmailIsAllowed(email)) roles.push("d_recruiter");
  if (departmentManagerEmailIsAllowed(email)) roles.push("d_department_manager");
  if (hrPortalEmailIsAllowed(email)) roles.push("d_hr");
  return roles;
}


async function establishStaffSession(
  email: string,
  company: import("@/lib/companies").CompanyId,
  frappeCookieHeader: string,
  staffRoles: StaffErpRole[],
): Promise<void> {
  const jar = await cookies();
  const af = jar.get(APPLICANT_FRAPPE_COOKIE)?.value?.trim();
  if (af) await erpnextLogoutWithCookie(af);
  await clearApplicantFrappeSessionCookies();
  const dm = jar.get(DEPARTMENT_MANAGER_FRAPPE_COOKIE)?.value?.trim();
  if (dm) await erpnextLogoutWithCookie(dm);
  await clearDepartmentManagerFrappeSessionCookies();
  jar.delete(SESSION_COOKIE);

  await setStaffFrappeSessionCookies(frappeCookieHeader, company);
  const payload: SessionPayload = {
    email,
    company,
    portal: "staff",
    staffRoles,
  };
  await setStaffSessionCookie(payload);
}

export async function login(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const company = parseCompanyId(String(formData.get("company") ?? "").trim());
  const returnTo = safeReturnToPath(String(formData.get("returnTo") ?? ""));

  if (!company) {
    return { error: "Invalid company. Use a sign-in link with ?company=aemg or ?company=aife." };
  }

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  if (!getERPNextSiteBaseUrl()) {
    return {
      error:
        "Sign-in is not configured (set ERPNEXT_BASE_URL to your Frappe site URL).",
    };
  }

  const result = await erpnextLoginWithPassword(email, password);
  if (!result.ok) {
    return { error: result.message };
  }

  const jar = await cookies();
  const rf = jar.get(RECRUITER_FRAPPE_COOKIE)?.value?.trim();
  if (rf) await erpnextLogoutWithCookie(rf);
  await clearRecruiterFrappeSessionCookies();
  const dm = jar.get(DEPARTMENT_MANAGER_FRAPPE_COOKIE)?.value?.trim();
  if (dm) await erpnextLogoutWithCookie(dm);
  await clearDepartmentManagerFrappeSessionCookies();
  jar.delete(SESSION_COOKIE);

  await setApplicantFrappeSessionCookies(result.cookieHeader, company);

  redirect(returnTo ?? "/applicant/dashboard");
}

export async function registerCandidate(
  _prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const phone = String(formData.get("phoneNumber") ?? "").trim();
  const linkedin = String(formData.get("linkedin") ?? "").trim();
  const company = parseCompanyId(String(formData.get("company") ?? "").trim());
  const returnTo = safeReturnToPath(String(formData.get("returnTo") ?? ""));

  if (!company) {
    return { error: "Invalid company. Use a sign-in link with ?company=aemg or ?company=aife." };
  }

  if (!email || !password || !firstName || !lastName) {
    return { error: "First name, last name, email, and password are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const reg = await registerERPNextWebsiteUserAndCandidate({
    email,
    password,
    firstName,
    lastName,
    phone: phone || undefined,
    linkedin: linkedin || undefined,
  });
  if (!reg.ok) {
    return { error: reg.message };
  }

  if (!getERPNextSiteBaseUrl()) {
    return {
      error:
        "Account created. Sign in is not configured (ERPNEXT_BASE_URL); please contact support.",
    };
  }

  const loginResult = await erpnextLoginWithPassword(email, password);
  if (!loginResult.ok) {
    return {
      error: `Account created. Automatic sign-in failed: ${loginResult.message}`,
    };
  }

  const jar = await cookies();
  const rf = jar.get(RECRUITER_FRAPPE_COOKIE)?.value?.trim();
  if (rf) await erpnextLogoutWithCookie(rf);
  await clearRecruiterFrappeSessionCookies();
  const dm = jar.get(DEPARTMENT_MANAGER_FRAPPE_COOKIE)?.value?.trim();
  if (dm) await erpnextLogoutWithCookie(dm);
  await clearDepartmentManagerFrappeSessionCookies();
  jar.delete(SESSION_COOKIE);

  await setApplicantFrappeSessionCookies(loginResult.cookieHeader, company);

  redirect(returnTo ?? "/applicant/dashboard");
}

export type RegisterRecruiterFormState = { error?: string } | null;

export async function registerRecruiter(
  _prevState: RegisterRecruiterFormState,
  formData: FormData,
): Promise<RegisterRecruiterFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const returnTo = staffReturnToPath(String(formData.get("returnTo") ?? ""));

  const company = RECRUITER_PORTAL_DEFAULT_COMPANY;

  if (!email || !password || !firstName || !lastName) {
    return { error: "First name, last name, email, and password are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (!recruiterEmailIsAllowed(email)) {
    return { error: "This email is not authorized for recruiter self-registration." };
  }

  const reg = await registerERPNextRecruiterDeskUser({
    email,
    password,
    firstName,
    lastName,
  });
  if (!reg.ok) {
    return { error: reg.message };
  }

  if (!getERPNextSiteBaseUrl()) {
    return {
      error:
        "Account created. Sign in is not configured (ERPNEXT_BASE_URL); please contact support.",
    };
  }

  const loginResult = await erpnextLoginWithPassword(email, password);
  if (!loginResult.ok) {
    return {
      error: `Account created. Automatic sign-in failed: ${loginResult.message}`,
    };
  }

  const jar = await cookies();
  const af = jar.get(APPLICANT_FRAPPE_COOKIE)?.value?.trim();
  if (af) await erpnextLogoutWithCookie(af);
  await clearApplicantFrappeSessionCookies();
  const dm = jar.get(DEPARTMENT_MANAGER_FRAPPE_COOKIE)?.value?.trim();
  if (dm) await erpnextLogoutWithCookie(dm);
  await clearDepartmentManagerFrappeSessionCookies();
  jar.delete(SESSION_COOKIE);

  await setRecruiterFrappeSessionCookies(loginResult.cookieHeader, company);

  redirect(returnTo ?? "/staff/dashboard");
}

/**
 * Unified staff sign-in: ERPNext desk user with at least one D-* recruitment role.
 */
export async function staffLogin(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const company = parseCompanyId(String(formData.get("company") ?? "").trim());
  const returnTo = staffReturnToPath(String(formData.get("returnTo") ?? ""));

  if (!company) {
    return { error: "Invalid company. Choose AEMG or AIFE." };
  }
  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const erpConfigured = Boolean(getERPNextSiteBaseUrl());

  if (erpConfigured) {
    const result = await erpnextLoginWithPassword(email, password);
    if (!result.ok) {
      return { error: result.message };
    }

    const deskRoleNames = new Set<string>(
      await fetchERPNextDeskRolesForUser(email),
    );
    for (const role of await fetchERPNextDeskRolesForSession(result.cookieHeader)) {
      deskRoleNames.add(role);
    }
    let staffRoles = staffErpRolesFromDeskAndProfileNames([...deskRoleNames]);
    if (staffRoles.length === 0) {
      staffRoles = staffRolesFromAllowLists(email);
    }
    if (staffRoles.length === 0) {
      const required = Object.values(ERP_STAFF_ROLE_NAMES).join(", ");
      return {
        error: `Your account does not have a staff recruitment role. Ask your administrator to assign one of: ${required}.`,
      };
    }

    await establishStaffSession(email, company, result.cookieHeader, staffRoles);
    redirect(returnTo ?? "/staff/dashboard");
  }

  if (hrPortalEmailIsAllowed(email)) {
    if (password.length < 6) {
      return {
        error:
          "HR access uses a demo rule: password must be at least 6 characters.",
      };
    }
    const store = await cookies();
    const rf = store.get(RECRUITER_FRAPPE_COOKIE)?.value?.trim();
    if (rf) await erpnextLogoutWithCookie(rf);
    await clearRecruiterFrappeSessionCookies();
    const dm = store.get(DEPARTMENT_MANAGER_FRAPPE_COOKIE)?.value?.trim();
    if (dm) await erpnextLogoutWithCookie(dm);
    await clearDepartmentManagerFrappeSessionCookies();
    const af = store.get(APPLICANT_FRAPPE_COOKIE)?.value?.trim();
    if (af) await erpnextLogoutWithCookie(af);
    await clearApplicantFrappeSessionCookies();
    store.delete(SESSION_COOKIE);
    const payload: SessionPayload = {
      email,
      company,
      portal: "staff",
      staffRoles: ["d_hr"],
    };
    store.set(SESSION_COOKIE, JSON.stringify(payload), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
    });
    redirect(returnTo ?? "/staff/dashboard");
  }

  return {
    error:
      "Desk sign-in is not configured (set ERPNEXT_BASE_URL), and this email is not authorized for the HR portal.",
  };
}

export async function recruiterLogin(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const returnTo = staffReturnToPath(String(formData.get("returnTo") ?? ""));

  const company = RECRUITER_PORTAL_DEFAULT_COMPANY;

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  if (!getERPNextSiteBaseUrl()) {
    return {
      error:
        "Recruiter sign-in is not configured (set ERPNEXT_BASE_URL to your Frappe site URL).",
    };
  }

  if (!recruiterEmailIsAllowed(email)) {
    return { error: "This email is not authorized for the recruiter portal." };
  }

  const result = await erpnextLoginWithPassword(email, password);
  if (!result.ok) {
    return { error: result.message };
  }

  const jar = await cookies();
  const af = jar.get(APPLICANT_FRAPPE_COOKIE)?.value?.trim();
  if (af) await erpnextLogoutWithCookie(af);
  await clearApplicantFrappeSessionCookies();
  const dm = jar.get(DEPARTMENT_MANAGER_FRAPPE_COOKIE)?.value?.trim();
  if (dm) await erpnextLogoutWithCookie(dm);
  await clearDepartmentManagerFrappeSessionCookies();
  jar.delete(SESSION_COOKIE);

  await setRecruiterFrappeSessionCookies(result.cookieHeader, company);

  redirect(returnTo ?? "/staff/dashboard");
}

export async function departmentManagerLogin(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const company = parseCompanyId(String(formData.get("company") ?? "").trim());
  const returnTo = staffReturnToPath(String(formData.get("returnTo") ?? ""));

  if (!company) {
    return { error: "Invalid company. Use a sign-in link with ?company=aemg or ?company=aife." };
  }

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  if (!getERPNextSiteBaseUrl()) {
    return {
      error:
        "Department manager sign-in is not configured (set ERPNEXT_BASE_URL to your Frappe site URL).",
    };
  }

  if (!departmentManagerEmailIsAllowed(email)) {
    return { error: "This email is not authorized for the department manager portal." };
  }

  const result = await erpnextLoginWithPassword(email, password);
  if (!result.ok) {
    return { error: result.message };
  }

  const jar = await cookies();
  const rf = jar.get(RECRUITER_FRAPPE_COOKIE)?.value?.trim();
  if (rf) await erpnextLogoutWithCookie(rf);
  await clearRecruiterFrappeSessionCookies();
  const af = jar.get(APPLICANT_FRAPPE_COOKIE)?.value?.trim();
  if (af) await erpnextLogoutWithCookie(af);
  await clearApplicantFrappeSessionCookies();
  jar.delete(SESSION_COOKIE);

  await setDepartmentManagerFrappeSessionCookies(result.cookieHeader, company);

  redirect(returnTo ?? "/staff/dashboard");
}

export async function hrPortalLogin(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const company = parseCompanyId(String(formData.get("company") ?? "").trim());
  const returnTo = staffReturnToPath(String(formData.get("returnTo") ?? ""));

  if (!company) {
    return { error: "Invalid company. Use a sign-in link with ?company=aemg or ?company=aife." };
  }

  if (!email || password.length < 6) {
    return {
      error:
        "Enter a valid email and a password with at least 6 characters (demo rules).",
    };
  }

  if (!hrPortalEmailIsAllowed(email)) {
    return { error: "This email is not authorized for the HR portal." };
  }

  const payload: SessionPayload = { email, company, portal: "hr_portal" };
  const store = await cookies();
  store.set(SESSION_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });

  redirect(returnTo ?? "/staff/dashboard");
}

export async function logout() {
  const store = await cookies();
  const applicantFrappe = store.get(APPLICANT_FRAPPE_COOKIE)?.value?.trim();
  const applicantCompanyRaw = store.get(APPLICANT_COMPANY_COOKIE)?.value;
  const applicantCompany = parseCompanyId(
    typeof applicantCompanyRaw === "string" ? applicantCompanyRaw.trim() : applicantCompanyRaw,
  );

  const recruiterFrappe = store.get(RECRUITER_FRAPPE_COOKIE)?.value?.trim();
  const recruiterCompanyRaw = store.get(RECRUITER_COMPANY_COOKIE)?.value;
  const recruiterCompany = parseCompanyId(
    typeof recruiterCompanyRaw === "string" ? recruiterCompanyRaw.trim() : recruiterCompanyRaw,
  );
  const hadRecruiterFrappeSession = Boolean(recruiterFrappe);

  const dmFrappe = store.get(DEPARTMENT_MANAGER_FRAPPE_COOKIE)?.value?.trim();
  const dmCompanyRaw = store.get(DEPARTMENT_MANAGER_COMPANY_COOKIE)?.value;
  const dmCompany = parseCompanyId(
    typeof dmCompanyRaw === "string" ? dmCompanyRaw.trim() : dmCompanyRaw,
  );
  const hadDmFrappeSession = Boolean(dmFrappe);

  const raw = store.get(SESSION_COOKIE)?.value;
  const parsed = parseSessionCookieJson(raw ?? undefined);

  const companyId =
    parsed?.company ?? applicantCompany ?? recruiterCompany ?? dmCompany ?? "aemg";

  if (recruiterFrappe) {
    await erpnextLogoutWithCookie(recruiterFrappe);
    await clearRecruiterFrappeSessionCookies();
  }

  if (applicantFrappe) {
    await erpnextLogoutWithCookie(applicantFrappe);
    store.delete(APPLICANT_FRAPPE_COOKIE);
    store.delete(APPLICANT_COMPANY_COOKIE);
  }

  if (dmFrappe) {
    await erpnextLogoutWithCookie(dmFrappe);
    await clearDepartmentManagerFrappeSessionCookies();
  }

  if (parsed) {
    store.delete(SESSION_COOKIE);
    if (isStaffPortalSession(parsed)) {
      redirect(`/staff/login?company=${parsed.company}`);
    }
    if (isRecruiterPortal(parsed)) {
      redirect(`/staff/login?company=${parsed.company}`);
    }
    if (isDepartmentManagerPortal(parsed)) {
      redirect(`/staff/login?company=${parsed.company}`);
    }
    if (isHrPortal(parsed)) {
      redirect(`/staff/login?company=${parsed.company}`);
    }
  } else {
    store.delete(SESSION_COOKIE);
  }

  if (hadRecruiterFrappeSession && !parsed) {
    redirect("/staff/login");
  }

  if (hadDmFrappeSession && !parsed) {
    redirect(`/staff/login?company=${dmCompany ?? "aemg"}`);
  }

  redirect(`/applicant/login?company=${companyId}&intent=applicant`);
}

/** @deprecated Use `recruiterLogin` — kept for any stale imports. */
export const hrLogin = recruiterLogin;
