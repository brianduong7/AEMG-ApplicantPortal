import type { Metadata } from "next";
import { RecruiterRegisterForm } from "@/components/recruiter-register-form";

export const metadata: Metadata = {
  title: "Register — Recruiter Portal",
  description: "Create a recruiter account linked to the system.",
};

type Props = {
  searchParams?: Promise<{ from?: string }>;
};

export default async function RecruiterRegisterPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const from =
    typeof sp.from === "string" &&
    (sp.from.startsWith("/staff") || sp.from.startsWith("/recruiter")) &&
    !sp.from.startsWith("/recruiter/login") &&
    !sp.from.startsWith("/recruiter/register") &&
    !sp.from.startsWith("/staff/login") ?
      sp.from
    : "";

  return <RecruiterRegisterForm returnTo={from || undefined} />;
}
