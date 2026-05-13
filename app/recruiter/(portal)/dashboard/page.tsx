import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  fetchERPNextInterviewsForHr,
  fetchERPNextJobApplicants,
  fetchERPNextJobOpeningsForHr,
  hasERPNextConfig,
} from "@/lib/erpnext";
import { hrGreetingNameFromEmail } from "@/lib/hr-display-name";
import { requireRecruiterSession } from "@/lib/recruiter-session";

export const metadata: Metadata = {
  title: "Dashboard — Recruiter",
};

export default async function RecruiterDashboardPage() {
  const session = await requireRecruiterSession();
  const name = hrGreetingNameFromEmail(session.email);

  let openings = 0;
  let applicants = 0;
  let interviews = 0;

  if (hasERPNextConfig()) {
    const o = await fetchERPNextJobOpeningsForHr();
    openings = o?.length ?? 0;
    const apps = await fetchERPNextJobApplicants({ limit: 500 });
    applicants = apps?.length ?? 0;
    const ints = await fetchERPNextInterviewsForHr();
    interviews = ints?.length ?? 0;
  }

  const statCard = (opts: {
    title: string;
    value: number;
    hint: string;
    href: string;
    iconBg: string;
    icon: ReactNode;
  }) => (
    <Link
      href={opts.href}
      className="group flex flex-col rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{opts.title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{opts.value}</p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${opts.iconBg} text-white shadow-sm`}
        >
          {opts.icon}
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-blue-600 group-hover:underline">{opts.hint}</p>
    </Link>
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Welcome back, {name}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Here is a snapshot of recruitment in ERPNext.
        </p>
      </div>

      {!hasERPNextConfig() ?
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-5 py-4 text-sm text-amber-950">
          Connect ERPNext (
          <code className="rounded bg-white/80 px-1">ERPNEXT_BASE_URL</code>, API key/secret) to
          see live counts.
        </div>
      : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {statCard({
          title: "Job openings",
          value: openings,
          hint: "View all openings →",
          href: "/recruiter/openings",
          iconBg: "bg-blue-600",
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <rect x="3" y="7" width="18" height="13" rx="2" />
              <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          ),
        })}
        {statCard({
          title: "Applicants",
          value: applicants,
          hint: "Browse applicants →",
          href: "/recruiter/applicants",
          iconBg: "bg-emerald-600",
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          ),
        })}
        {statCard({
          title: "Interviews",
          value: interviews,
          hint: "View schedule →",
          href: "/recruiter/interviews",
          iconBg: "bg-violet-600",
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          ),
        })}
      </div>

      <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/recruiter/openings/new"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            New job opening
          </Link>
          <Link
            href="/recruiter/applicants"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            Review applicants
          </Link>
          <Link
            href="/recruiter/interviews"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            Interview calendar
          </Link>
        </div>
      </section>
    </div>
  );
}
