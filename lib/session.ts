import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth-constants";
import { parseCompanyId, type CompanyId } from "@/lib/companies";

export type SessionPayload = {
  email: string;
  company: CompanyId;
};

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as SessionPayload;
    if (typeof data.email !== "string" || !data.email) return null;
    const company = parseCompanyId(data.company);
    if (!company) return null;
    return { email: data.email, company };
  } catch {
    return null;
  }
}
