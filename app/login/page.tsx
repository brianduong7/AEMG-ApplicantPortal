import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { companyFromSearchParam, parseCompanyId } from "@/lib/companies";

export const metadata: Metadata = {
  title: "Sign in — Applicant Portal",
  description: "Sign in to browse roles and submit your application.",
};

type Props = {
  searchParams?: Promise<{ company?: string; from?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const raw = typeof sp.company === "string" ? sp.company.trim() : "";
  const from =
    typeof sp.from === "string" && sp.from.startsWith("/") ? sp.from : "";

  if (raw && parseCompanyId(raw) === null) {
    const q = new URLSearchParams();
    q.set("company", "aemg");
    if (from) q.set("from", from);
    redirect(`/login?${q.toString()}`);
  }

  const companyId = companyFromSearchParam(sp.company);

  return <LoginForm companyId={companyId} returnTo={from || undefined} />;
}
