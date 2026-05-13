import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/register-form";
import { companyFromSearchParam, parseCompanyId } from "@/lib/companies";

export const metadata: Metadata = {
  title: "Register — Applicant Portal",
  description: "Create an applicant account linked to ERPNext.",
};

type Props = {
  searchParams?: Promise<{ company?: string; from?: string }>;
};

export default async function ApplicantRegisterPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const raw = typeof sp.company === "string" ? sp.company.trim() : "";
  const from =
    typeof sp.from === "string" && sp.from.startsWith("/") ? sp.from : "";

  if (raw && parseCompanyId(raw) === null) {
    const q = new URLSearchParams();
    q.set("company", "aemg");
    if (from) q.set("from", from);
    redirect(`/applicant/register?${q.toString()}`);
  }

  const companyId = companyFromSearchParam(sp.company);

  return <RegisterForm companyId={companyId} returnTo={from || undefined} />;
}
