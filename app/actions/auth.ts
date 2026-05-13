"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth-constants";
import { parseCompanyId } from "@/lib/companies";
import {
  isDepartmentManagerPortal,
  isHrPortal,
  isRecruiterPortal,
  parseSessionCookieJson,
  type SessionPayload,
} from "@/lib/session";

export type AuthFormState = { error?: string } | null;

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

  if (!email || password.length < 6) {
    return {
      error:
        "Enter a valid email and a password with at least 6 characters (demo rules).",
    };
  }

  const payload: SessionPayload = { email, company, portal: "applicant" };
  const store = await cookies();
  store.set(SESSION_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });

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
  let company = "aemg";
  const raw = store.get(SESSION_COOKIE)?.value;
  const parsed = parseSessionCookieJson(raw ?? undefined);
  if (parsed) {
    company = parsed.company;
  }
  store.delete(SESSION_COOKIE);

  if (!parsed) {
    redirect(`/applicant/login?company=${company}`);
  }
  if (isRecruiterPortal(parsed)) {
    redirect(`/recruiter/login?company=${company}`);
  }
  if (isDepartmentManagerPortal(parsed)) {
    redirect(`/department-manager/login?company=${company}`);
  }
  if (isHrPortal(parsed)) {
    redirect(`/hr-portal/login?company=${company}`);
  }
  redirect(`/applicant/login?company=${company}`);
}

/** @deprecated Use `recruiterLogin` — kept for any stale imports. */
export const hrLogin = recruiterLogin;
