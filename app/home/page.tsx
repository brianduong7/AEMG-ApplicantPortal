import type { Metadata } from "next";
import Link from "next/link";
import { companyFromSearchParam } from "@/lib/companies";
import { getSession, isApplicantPortal, isStaffPortalSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Choose portal",
  description: "Select the applicant or staff portal.",
};

type Props = {
  searchParams?: Promise<{ company?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const session = await getSession();
  const sp = (await searchParams) ?? {};
  const companyId = companyFromSearchParam(sp.company);
  const companyQ = encodeURIComponent(companyId);

  const applicantHref =
    session && isApplicantPortal(session) ?
      "/applicant/dashboard"
    : `/applicant/login?company=${companyQ}&intent=applicant`;

  const staffHref =
    session && isStaffPortalSession(session) ?
      "/staff/dashboard"
    : `/staff/login?company=${companyQ}`;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Choose Portal</h1>
        <p className="mt-2 text-sm text-slate-600">
          Select a portal, or preview published roles on the careers website.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href={applicantHref}
            className="rounded-xl border border-slate-300 bg-white px-4 py-6 text-center text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-100"
          >
            Applicant Portal
          </Link>

          <Link
            href={staffHref}
            className="rounded-xl border border-slate-300 bg-white px-4 py-6 text-center text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-100"
          >
            Staff Portal
          </Link>

          <Link
            href="/careers"
            className="rounded-xl border border-slate-300 bg-white px-4 py-6 text-center text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-100"
          >
            Careers Website
          </Link>
        </div>
      </div>
    </main>
  );
}
