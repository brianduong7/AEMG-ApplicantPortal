"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth-constants";
import { parseCompanyId } from "@/lib/companies";
import { type SessionPayload } from "@/lib/session";

export type AuthFormState = { error?: string } | null;

function safeReturnToPath(raw: string): string | null {
  const path = raw.trim();
  if (!path.startsWith("/jobs")) return null;
  if (path.startsWith("//") || path.includes("://")) return null;
  return path;
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

  const payload: SessionPayload = { email, company };
  const store = await cookies();
  store.set(SESSION_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });

  redirect(returnTo ?? "/jobs");
}

export async function logout() {
  const store = await cookies();
  let company = "aemg";
  const raw = store.get(SESSION_COOKIE)?.value;
  if (raw) {
    try {
      const data = JSON.parse(raw) as { company?: unknown };
      const parsed = parseCompanyId(data.company);
      if (parsed) company = parsed;
    } catch {
      /* ignore */
    }
  }
  store.delete(SESSION_COOKIE);
  redirect(`/login?company=${company}`);
}
