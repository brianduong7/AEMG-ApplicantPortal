import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StaffLoginForm } from "@/components/staff-login-form";
import { companyFromSearchParam, parseCompanyId } from "@/lib/companies";

export const metadata: Metadata = {
  title: "Staff sign in",
  description: "Sign in to the staff workspace.",
};

type Props = {
  searchParams?: Promise<{ company?: string; from?: string; staleSession?: string }>;
};

export default async function StaffLoginPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const raw = typeof sp.company === "string" ? sp.company.trim() : "";
  const companyId = companyFromSearchParam(sp.company);

  const fromRaw = typeof sp.from === "string" ? sp.from.trim() : "";
  const from =
    fromRaw &&
    fromRaw.startsWith("/staff") &&
    !fromRaw.startsWith("/staff/login") &&
    !fromRaw.startsWith("//") &&
    !fromRaw.includes("://") ?
      fromRaw
    : "";

  if (raw && parseCompanyId(raw) === null) {
    const q = new URLSearchParams();
    q.set("company", "aemg");
    if (from) q.set("from", from);
    if (typeof sp.staleSession === "string") q.set("staleSession", sp.staleSession);
    redirect(`/staff/login?${q.toString()}`);
  }

  const staleSession = sp.staleSession === "1";

  return (
    <StaffLoginForm
      companyId={companyId}
      returnTo={from || undefined}
      staleSession={staleSession}
    />
  );
}
