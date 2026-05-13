import { cookies } from "next/headers";
import {
  APPLICANT_COMPANY_COOKIE,
  APPLICANT_FRAPPE_COOKIE,
} from "@/lib/auth-constants";
import { parseCompanyId, type CompanyId } from "@/lib/companies";
import { getERPNextSiteBaseUrl } from "@/lib/erpnext";
import { humanMessageFromFrappeJsonValue } from "@/lib/frappe-error-message";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7,
};

function buildCookieHeaderFromSetCookies(setCookieValues: string[]): string {
  const pairs: string[] = [];
  for (const line of setCookieValues) {
    const first = line.split(";")[0]?.trim();
    if (first?.includes("=")) pairs.push(first);
  }
  return pairs.join("; ");
}

function collectSetCookieHeaders(res: Response): string[] {
  const fn = res.headers.getSetCookie?.bind(res.headers);
  if (typeof fn === "function") {
    const list = fn();
    if (list.length > 0) return list;
  }
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

function frappeJsonLooksLikeFailure(json: unknown): boolean {
  if (!json || typeof json !== "object") return false;
  const o = json as Record<string, unknown>;
  if (typeof o.exception === "string" && o.exception.length > 0) return true;
  if (Array.isArray(o._server_messages) && o._server_messages.length > 0) return true;
  return false;
}

export async function erpnextLoginWithPassword(
  usr: string,
  pwd: string,
): Promise<{ ok: true; cookieHeader: string } | { ok: false; message: string }> {
  const base = getERPNextSiteBaseUrl();
  if (!base) {
    return {
      ok: false,
      message: "Sign-in is unavailable (missing ERPNEXT_BASE_URL).",
    };
  }

  const url = new URL(
    "/api/method/login",
    base.endsWith("/") ? base : `${base}/`,
  );
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ usr: usr.trim(), pwd }),
    cache: "no-store",
  });

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  const cookieHeader = buildCookieHeaderFromSetCookies(collectSetCookieHeaders(res));
  const failedBody = frappeJsonLooksLikeFailure(json) || !res.ok;
  if (failedBody || cookieHeader.length === 0) {
    if (json && (frappeJsonLooksLikeFailure(json) || !res.ok)) {
      const parsed = humanMessageFromFrappeJsonValue(json);
      if (parsed) return { ok: false, message: parsed };
    }
    if (!res.ok) {
      return { ok: false, message: "Invalid email or password." };
    }
    if (cookieHeader.length === 0) {
      return {
        ok: false,
        message:
          "Sign-in did not return a session cookie. Check ERPNEXT_BASE_URL and that cookies are not stripped by a proxy.",
      };
    }
  }

  return { ok: true, cookieHeader };
}

export async function erpnextLogoutWithCookie(cookieHeader: string): Promise<void> {
  const base = getERPNextSiteBaseUrl();
  if (!base || !cookieHeader.trim()) return;

  const url = new URL(
    "/api/method/logout",
    base.endsWith("/") ? base : `${base}/`,
  );
  await fetch(url.toString(), {
    method: "POST",
    headers: {
      Accept: "application/json",
      Cookie: cookieHeader.trim(),
    },
    cache: "no-store",
  });
}

export async function erpnextGetLoggedUser(cookieHeader: string): Promise<string | null> {
  const base = getERPNextSiteBaseUrl();
  const trimmed = cookieHeader.trim();
  if (!base || !trimmed) return null;

  const url = new URL(
    "/api/method/frappe.auth.get_logged_user",
    base.endsWith("/") ? base : `${base}/`,
  );
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Cookie: trimmed,
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return null;
  }
  if (!json || typeof json !== "object") return null;
  const msg = (json as { message?: unknown }).message;
  if (typeof msg !== "string" || !msg.trim()) return null;
  if (msg === "Guest") return null;
  return msg.trim();
}

export async function setApplicantFrappeSessionCookies(
  frappeCookieHeader: string,
  company: CompanyId,
): Promise<void> {
  const store = await cookies();
  store.set(APPLICANT_FRAPPE_COOKIE, frappeCookieHeader, COOKIE_OPTS);
  store.set(APPLICANT_COMPANY_COOKIE, company, {
    ...COOKIE_OPTS,
    maxAge: COOKIE_OPTS.maxAge,
  });
}

export async function clearApplicantFrappeSessionCookies(): Promise<void> {
  const store = await cookies();
  store.delete(APPLICANT_FRAPPE_COOKIE);
  store.delete(APPLICANT_COMPANY_COOKIE);
}

export async function readApplicantFrappeCookieHeader(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(APPLICANT_FRAPPE_COOKIE)?.value;
  const t = raw?.trim();
  return t ? t : null;
}

export async function readApplicantCompanyCookie(): Promise<CompanyId | null> {
  const store = await cookies();
  const raw = store.get(APPLICANT_COMPANY_COOKIE)?.value;
  return parseCompanyId(typeof raw === "string" ? raw.trim() : raw);
}

export type ApplicantResolvedSession = {
  email: string;
  company: CompanyId;
  portal: "applicant";
};

/**
 * Resolves applicant portal session from HttpOnly Frappe cookie jar + company cookie.
 * Validates live session via `frappe.auth.get_logged_user`.
 */
export async function resolveApplicantSessionPayload(): Promise<ApplicantResolvedSession | null> {
  const cookieHeader = await readApplicantFrappeCookieHeader();
  const company = await readApplicantCompanyCookie();
  if (!cookieHeader || !company) return null;

  const user = await erpnextGetLoggedUser(cookieHeader);
  if (!user) {
    await clearApplicantFrappeSessionCookies();
    return null;
  }

  return { email: user, company, portal: "applicant" };
}

export function applicantFrappeCookieIsPresent(cookieVal: string | undefined): boolean {
  return Boolean(cookieVal?.trim());
}
