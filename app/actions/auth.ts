"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  erpnextLoginWithPassword,
  erpnextLogoutWithCookie,
  setApplicantFrappeSessionCookies,
} from "@/lib/applicant-erpnext-session";
import { SESSION_COOKIE, APPLICANT_FRAPPE_COOKIE, APPLICANT_COMPANY_COOKIE } from "@/lib/auth-constants";
import { parseCompanyId } from "@/lib/companies";
import { getERPNextSiteBaseUrl, registerERPNextWebsiteUserAndCandidate } from "@/lib/erpnext";
import {
  isDepartmentManagerPortal,
  isHrPortal,
  isRecruiterPortal,
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

function safeRecruiterReturnToPath(raw: string): string | null {
  const path = raw.trim();
  if (!path.startsWith("/recruiter")) return null;
  if (path.startsWith("/recruiter/login")) return null;
  if (path.startsWith("//") || path.includes("://")) return null;
  return path;
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
  return path;
}

function safeHrPortalReturnToPath(raw: string): string | null {
  const path = raw.trim();
  if (!path.startsWith("/hr-portal")) return null;
  if (path.startsWith("/hr-portal/login")) return null;
  if (path.startsWith("//") || path.includes("://")) return null;
  return path;
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
  if (!raw) return true;
  const allowed = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
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

  await setApplicantFrappeSessionCookies(loginResult.cookieHeader, company);

  redirect(returnTo ?? "/applicant/dashboard");
}

export async function recruiterLogin(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const company = parseCompanyId(String(formData.get("company") ?? "").trim());
  const returnTo = safeRecruiterReturnToPath(String(formData.get("returnTo") ?? ""));

  if (!company) {
    return { error: "Invalid company. Use a sign-in link with ?company=aemg or ?company=aife." };
  }

  if (!email || password.length < 6) {
    return {
      error:
        "Enter a valid email and a password with at least 6 characters (demo rules).",
    };
  }

  if (!recruiterEmailIsAllowed(email)) {
    return { error: "This email is not authorized for the recruiter portal." };
  }

  const payload: SessionPayload = { email, company, portal: "recruiter" };
  const store = await cookies();
  store.set(SESSION_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });

  redirect(returnTo ?? "/recruiter/dashboard");
}

export async function departmentManagerLogin(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const company = parseCompanyId(String(formData.get("company") ?? "").trim());
  const returnTo = safeDepartmentManagerReturnToPath(String(formData.get("returnTo") ?? ""));

  if (!company) {
    return { error: "Invalid company. Use a sign-in link with ?company=aemg or ?company=aife." };
  }

  if (!email || password.length < 6) {
    return {
      error:
        "Enter a valid email and a password with at least 6 characters (demo rules).",
    };
  }

  if (!departmentManagerEmailIsAllowed(email)) {
    return { error: "This email is not authorized for the department manager portal." };
  }

  const payload: SessionPayload = { email, company, portal: "department_manager" };
  const store = await cookies();
  store.set(SESSION_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });

  redirect(returnTo ?? "/department-manager/dashboard");
}

export async function hrPortalLogin(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const company = parseCompanyId(String(formData.get("company") ?? "").trim());
  const returnTo = safeHrPortalReturnToPath(String(formData.get("returnTo") ?? ""));

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

  redirect(returnTo ?? "/hr-portal/dashboard");
}

export async function logout() {
  const store = await cookies();
  const frappe = store.get(APPLICANT_FRAPPE_COOKIE)?.value?.trim();
  const companyRaw = store.get(APPLICANT_COMPANY_COOKIE)?.value;
  const applicantCompany = parseCompanyId(
    typeof companyRaw === "string" ? companyRaw.trim() : companyRaw,
  );

  const raw = store.get(SESSION_COOKIE)?.value;
  const parsed = parseSessionCookieJson(raw ?? undefined);

  const companyId = parsed?.company ?? applicantCompany ?? "aemg";

  if (frappe) {
    await erpnextLogoutWithCookie(frappe);
    store.delete(APPLICANT_FRAPPE_COOKIE);
    store.delete(APPLICANT_COMPANY_COOKIE);
  }

  if (parsed) {
    store.delete(SESSION_COOKIE);
    if (isRecruiterPortal(parsed)) {
      redirect(`/recruiter/login?company=${parsed.company}`);
    }
    if (isDepartmentManagerPortal(parsed)) {
      redirect(`/department-manager/login?company=${parsed.company}`);
    }
    if (isHrPortal(parsed)) {
      redirect(`/hr-portal/login?company=${parsed.company}`);
    }
  } else {
    store.delete(SESSION_COOKIE);
  }

  redirect(`/applicant/login?company=${companyId}&intent=applicant`);
}

/** @deprecated Use `recruiterLogin` — kept for any stale imports. */
export const hrLogin = recruiterLogin;
