import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  applicantStatusProgress,
  getApplicantApplicationDetail,
} from "@/lib/applications";
import { hasERPNextConfig } from "@/lib/erpnext";
import { getPortalTheme } from "@/lib/portal-theme";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Application details — Applicant Portal",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ApplicantApplicationDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/applicant/login?intent=applicant");

  const { id } = await params;
  const decoded = decodeURIComponent(id).trim();
  if (!decoded) notFound();

  const t = getPortalTheme(session.company);

  if (!hasERPNextConfig()) {
    return (
      <div>
        <h1 className={t.pageTitle}>Application</h1>
        <p className={t.pageSubtitle}>Recruitment backend is not configured on this server.</p>
      </div>
    );
  }

  const application = await getApplicantApplicationDetail(decoded);
  if (!application) notFound();

  const { steps, activeIndex } = applicantStatusProgress(application.status);
  const isRejected = /reject/i.test(application.status);
  const isAemg = session.company === "aemg";
  const accent = isAemg ? "bg-[#00AEEF]" : "bg-[#0a1628]";
  const accentText = isAemg ? "text-[#00AEEF]" : "text-[#0d4f6e]";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/applicant/applications" className={t.backLink}>
          ← My applications
        </Link>
        <h1 className={`${t.pageTitle} mt-3`}>{application.jobTitle}</h1>
        <p className={t.pageSubtitle}>
          Applied on {application.appliedAt}
          {application.openingId !== "—" ?
            <span className="font-mono text-xs text-slate-500"> · {application.openingId}</span>
          : null}
        </p>
      </div>

      <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Application status
        </h2>
        <p className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-800">
          {application.status}
        </p>

        <ol className="mt-6 flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-0">
          {steps.map((step, index) => {
            const done = isRejected ? index <= activeIndex : index < activeIndex;
            const current = index === activeIndex;
            const muted = isRejected && step === "Rejected" ? false : isRejected && index > activeIndex;
            return (
              <li
                key={step}
                className="flex flex-1 flex-col items-start gap-2 sm:items-center sm:text-center"
              >
                <div className="flex w-full items-center sm:flex-col sm:gap-2">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                      current ? accent
                      : done ? "bg-emerald-500"
                      : muted ? "bg-slate-200 text-slate-500"
                      : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {done && !current ? "✓" : index + 1}
                  </span>
                  {index < steps.length - 1 ?
                    <span className="mx-2 hidden h-0.5 flex-1 bg-slate-200 sm:block" aria-hidden />
                  : null}
                </div>
                <span
                  className={`text-xs font-medium ${
                    current ? accentText
                    : done ? "text-emerald-700"
                    : "text-slate-500"
                  }`}
                >
                  {step}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="mt-4 text-sm text-slate-600">
          Status updates when your recruiter or HR team progresses your application in the hiring
          system.
        </p>
      </section>

      <section className="grid gap-6 rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Your details</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-slate-900">{application.applicantName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="text-slate-800">{application.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Phone</dt>
              <dd className="text-slate-800">{application.phone}</dd>
            </div>
          </dl>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Role</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-slate-500">Job opening</dt>
              <dd className="font-medium text-slate-900">{application.jobTitle}</dd>
            </div>
            {application.jobDepartment ?
              <div>
                <dt className="text-slate-500">Department</dt>
                <dd className="text-slate-800">{application.jobDepartment}</dd>
              </div>
            : null}
            {application.jobLocation ?
              <div>
                <dt className="text-slate-500">Location</dt>
                <dd className="text-slate-800">{application.jobLocation}</dd>
              </div>
            : null}
          </dl>
        </div>
      </section>

      <div className="flex flex-wrap gap-4">
        <Link href="/applicant/job-offers" className={t.backLink}>
          Job offers
        </Link>
        <Link href="/applicant/jobs" className={t.backLink}>
          Browse open roles
        </Link>
      </div>
    </div>
  );
}
