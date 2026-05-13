import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getApplicationsForCurrentApplicant } from "@/lib/applications";
import { getPortalTheme } from "@/lib/portal-theme";
import { getJobsByCompany } from "@/lib/jobs";
import { getSession } from "@/lib/session";
import { hrGreetingNameFromEmail } from "@/lib/hr-display-name";

export const metadata: Metadata = {
  title: "Dashboard — Applicant Portal",
};

export default async function ApplicantDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/applicant/login?intent=applicant");

  const t = getPortalTheme(session.company);
  const jobs = await getJobsByCompany(session.company);
  const applications = await getApplicationsForCurrentApplicant(session.company);
  const greeting = hrGreetingNameFromEmail(session.email);
  const roleCount = jobs.length;
  const appCount = applications.length;
  const isAemg = session.company === "aemg";
  const primaryBtn =
    isAemg ?
      "bg-[#00AEEF] hover:bg-[#0095cf]"
    : "bg-[#0a1628] hover:bg-[#142840]";
  const openingsLink = isAemg ? "text-[#00AEEF]" : "text-[#0d4f6e]";
  const openingsRing = isAemg ? "hover:border-[#00AEEF]/40" : "hover:border-[#0a1628]/30";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className={t.pageTitle}>Welcome back, {greeting}</h1>
        <p className={t.pageSubtitle}>
          Here is a snapshot of open roles for your company. Browse openings, track applications, or
          update your profile.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/applicant/jobs"
          className={`group flex flex-col rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md ${openingsRing}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">Open roles</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{roleCount}</p>
            </div>
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm ${isAemg ? "bg-[#00AEEF]" : "bg-[#0a1628]"}`}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <rect x="3" y="7" width="18" height="13" rx="2" />
                <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </span>
          </div>
          <p className={`mt-3 text-sm font-medium group-hover:underline ${openingsLink}`}>View job openings →</p>
        </Link>

        <Link
          href="/applicant/applications"
          className="group flex flex-col rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">Applications</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{appCount}</p>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
              </svg>
            </span>
          </div>
          <p className="mt-3 text-sm font-medium text-emerald-700 group-hover:underline">My applications →</p>
        </Link>

        <Link
          href="/applicant/profile"
          className="group flex flex-col rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-violet-300 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">Profile</p>
              <p className="mt-2 text-sm font-medium text-slate-800">Contact & details</p>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <circle cx="12" cy="8" r="4" />
                <path d="M6 21v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1" />
              </svg>
            </span>
          </div>
          <p className="mt-3 text-sm font-medium text-violet-700 group-hover:underline">My info →</p>
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/applicant/jobs"
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition ${primaryBtn}`}
          >
            Browse all roles
          </Link>
          <Link
            href="/applicant/applications"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            Review applications
          </Link>
          <Link
            href="/applicant/profile"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            Update my info
          </Link>
        </div>
      </section>
    </div>
  );
}
