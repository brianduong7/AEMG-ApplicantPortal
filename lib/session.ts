import { cookies } from "next/headers";
import { resolveApplicantSessionPayload } from "@/lib/applicant-erpnext-session";
import { SESSION_COOKIE } from "@/lib/auth-constants";
import { parseCompanyId, type CompanyId } from "@/lib/companies";

export type PortalKind = "applicant" | "recruiter" | "department_manager" | "hr_portal";

export type SessionPayload = {
  email: string;
  company: CompanyId;
  /** When unset, the session is treated as the applicant portal (backwards compatible). */
  portal?: PortalKind;
};

function normalizePortal(raw: unknown): PortalKind | undefined {
  if (
    raw === "recruiter" ||
    raw === "applicant" ||
    raw === "department_manager" ||
    raw === "hr_portal"
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
    };
    if (typeof data.email !== "string" || !data.email) return null;
    const company = parseCompanyId(data.company);
    if (!company) return null;
    const portal = normalizePortal(data.portal);
    return { email: data.email, company, portal };
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

export async function getSession(): Promise<SessionPayload | null> {
  const applicant = await resolveApplicantSessionPayload();
  if (applicant) return applicant;

  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  return parseSessionCookieJson(raw ?? undefined);
}
