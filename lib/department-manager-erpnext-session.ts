import { cookies } from "next/headers";
import {
  DEPARTMENT_MANAGER_COMPANY_COOKIE,
  DEPARTMENT_MANAGER_FRAPPE_COOKIE,
} from "@/lib/auth-constants";
import { erpnextGetLoggedUser } from "@/lib/applicant-erpnext-session";
import { parseCompanyId, type CompanyId } from "@/lib/companies";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7,
};

export async function setDepartmentManagerFrappeSessionCookies(
  frappeCookieHeader: string,
  company: CompanyId,
): Promise<void> {
  const store = await cookies();
  store.set(DEPARTMENT_MANAGER_FRAPPE_COOKIE, frappeCookieHeader, COOKIE_OPTS);
  store.set(DEPARTMENT_MANAGER_COMPANY_COOKIE, company, COOKIE_OPTS);
}

export async function clearDepartmentManagerFrappeSessionCookies(): Promise<void> {
  const store = await cookies();
  store.delete(DEPARTMENT_MANAGER_FRAPPE_COOKIE);
  store.delete(DEPARTMENT_MANAGER_COMPANY_COOKIE);
}

export async function readDepartmentManagerFrappeCookieHeader(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(DEPARTMENT_MANAGER_FRAPPE_COOKIE)?.value;
  const t = raw?.trim();
  return t ? t : null;
}

export async function readDepartmentManagerCompanyCookie(): Promise<CompanyId | null> {
  const store = await cookies();
  const raw = store.get(DEPARTMENT_MANAGER_COMPANY_COOKIE)?.value;
  return parseCompanyId(typeof raw === "string" ? raw.trim() : raw);
}

export type DepartmentManagerResolvedSession = {
  email: string;
  company: CompanyId;
  portal: "department_manager";
};

/**
 * Resolves department manager portal session from HttpOnly Frappe cookies (ERPNext login).
 */
export async function resolveDepartmentManagerSessionPayload(): Promise<DepartmentManagerResolvedSession | null> {
  const cookieHeader = await readDepartmentManagerFrappeCookieHeader();
  const company = await readDepartmentManagerCompanyCookie();
  if (!cookieHeader || !company) return null;

  const user = await erpnextGetLoggedUser(cookieHeader);
  if (!user) {
    return null;
  }

  return { email: user, company, portal: "department_manager" };
}

export function departmentManagerFrappeCookieIsPresent(cookieVal: string | undefined): boolean {
  return Boolean(cookieVal?.trim());
}
