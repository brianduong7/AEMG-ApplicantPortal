import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StaffPortalLoginForm } from "@/components/staff-portal-login-form";
import { companyFromSearchParam, parseCompanyId } from "@/lib/companies";

export const metadata: Metadata = {
  title: "Department manager sign in",
  description: "Sign in to the department manager portal.",
};

type Props = {
  searchParams?: Promise<{ company?: string; from?: string }>;
};

export default async function DepartmentManagerLoginPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const raw = typeof sp.company === "string" ? sp.company.trim() : "";
  const from =
    typeof sp.from === "string" &&
    sp.from.startsWith("/department-manager") &&
    !sp.from.startsWith("/department-manager/login") ?
      sp.from
    : "";

  if (raw && parseCompanyId(raw) === null) {
    const q = new URLSearchParams();
    q.set("company", "aemg");
    if (from) q.set("from", from);
    redirect(`/department-manager/login?${q.toString()}`);
  }

  const companyId = companyFromSearchParam(sp.company);

  return <StaffPortalLoginForm portal="department_manager" companyId={companyId} returnTo={from || undefined} />;
}
