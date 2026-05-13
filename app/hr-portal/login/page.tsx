import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StaffPortalLoginForm } from "@/components/staff-portal-login-form";
import { companyFromSearchParam, parseCompanyId } from "@/lib/companies";

export const metadata: Metadata = {
  title: "HR sign in",
  description: "Sign in to the HR portal.",
};

type Props = {
  searchParams?: Promise<{ company?: string; from?: string }>;
};

export default async function HrPortalLoginPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const raw = typeof sp.company === "string" ? sp.company.trim() : "";
  const from =
    typeof sp.from === "string" &&
    sp.from.startsWith("/hr-portal") &&
    !sp.from.startsWith("/hr-portal/login") ?
      sp.from
    : "";

  if (raw && parseCompanyId(raw) === null) {
    const q = new URLSearchParams();
    q.set("company", "aemg");
    if (from) q.set("from", from);
    redirect(`/hr-portal/login?${q.toString()}`);
  }

  const companyId = companyFromSearchParam(sp.company);

  return <StaffPortalLoginForm portal="hr_portal" companyId={companyId} returnTo={from || undefined} />;
}
