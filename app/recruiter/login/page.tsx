import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RecruiterLoginForm } from "@/components/recruiter-login-form";
import { companyFromSearchParam, parseCompanyId } from "@/lib/companies";

export const metadata: Metadata = {
  title: "Recruiter sign in",
  description: "Sign in to the recruiter portal for job openings and applicants.",
};

type Props = {
  searchParams?: Promise<{ company?: string; from?: string }>;
};

export default async function RecruiterLoginPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const raw = typeof sp.company === "string" ? sp.company.trim() : "";
  const from =
    typeof sp.from === "string" &&
    sp.from.startsWith("/recruiter") &&
    !sp.from.startsWith("/recruiter/login") ?
      sp.from
    : "";

  if (raw && parseCompanyId(raw) === null) {
    const q = new URLSearchParams();
    q.set("company", "aemg");
    if (from) q.set("from", from);
    redirect(`/recruiter/login?${q.toString()}`);
  }

  const companyId = companyFromSearchParam(sp.company);

  return <RecruiterLoginForm companyId={companyId} returnTo={from || undefined} />;
}
