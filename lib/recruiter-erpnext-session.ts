import { cookies } from "next/headers";
import {
  RECRUITER_COMPANY_COOKIE,
  RECRUITER_FRAPPE_COOKIE,
} from "@/lib/auth-constants";
import { parseCompanyId, type CompanyId } from "@/lib/companies";
import { erpnextGetLoggedUser } from "@/lib/applicant-erpnext-session";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7,
};

export async function setRecruiterFrappeSessionCookies(
  frappeCookieHeader: string,
  company: CompanyId,
): Promise<void> {
  const store = await cookies();
  store.set(RECRUITER_FRAPPE_COOKIE, frappeCookieHeader, COOKIE_OPTS);
  store.set(RECRUITER_COMPANY_COOKIE, company, COOKIE_OPTS);
}

export async function clearRecruiterFrappeSessionCookies(): Promise<void> {
  const store = await cookies();
  store.delete(RECRUITER_FRAPPE_COOKIE);
  store.delete(RECRUITER_COMPANY_COOKIE);
}

export async function readRecruiterFrappeCookieHeader(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(RECRUITER_FRAPPE_COOKIE)?.value;
  const t = raw?.trim();
  return t ? t : null;
}

export async function readRecruiterCompanyCookie(): Promise<CompanyId | null> {
  const store = await cookies();
  const raw = store.get(RECRUITER_COMPANY_COOKIE)?.value;
  return parseCompanyId(typeof raw === "string" ? raw.trim() : raw);
}

export type RecruiterResolvedSession = {
  email: string;
  company: CompanyId;
  portal: "recruiter";
};

/**
 * Resolves recruiter portal session from HttpOnly Frappe cookies (ERPNext System User login).
 */
export async function resolveRecruiterSessionPayload(): Promise<RecruiterResolvedSession | null> {
  const cookieHeader = await readRecruiterFrappeCookieHeader();
  const company = await readRecruiterCompanyCookie();
  if (!cookieHeader || !company) return null;

  const user = await erpnextGetLoggedUser(cookieHeader);
  if (!user) {
    /** Do not call `clearRecruiterFrappeSessionCookies` here — `cookies().delete` is not allowed during RSC (e.g. `getSession()` on `/home`). Stale jars are cleared via middleware when redirecting to login with `staleSession=1`, or from `logout`. */
    return null;
  }

  return { email: user, company, portal: "recruiter" };
}

export function recruiterFrappeCookieIsPresent(cookieVal: string | undefined): boolean {
  return Boolean(cookieVal?.trim());
}
