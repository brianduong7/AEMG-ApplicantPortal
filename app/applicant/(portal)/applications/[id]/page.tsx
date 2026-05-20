import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  APPLICANT_PIPELINE_OFFER_DECLINED,
  APPLICANT_PIPELINE_OFFER_SENT,
  APPLICANT_PIPELINE_REJECTED,
  applicantStatusIsTerminalNegative,
  applicantStatusProgress,
  getApplicantApplicationDetail,
  isApplicantPipelineStepCompleted,
  jobOfferStatusDisplayLabel,
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

function formatInterviewWhen(scheduledOn: string, fromTime?: string, toTime?: string): string {
  const parts = [scheduledOn];
  if (fromTime?.trim()) {
    parts.push(toTime?.trim() ? `${fromTime} – ${toTime}` : fromTime);
  }
  return parts.filter((p) => p && p !== "—").join(" · ");
}

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

  const { steps, activeIndex } = applicantStatusProgress(application.displayStatus);
  const isTerminalNegative = applicantStatusIsTerminalNegative(application.displayStatus);
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
          {application.displayStatus}
        </p>

        <ol className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-2">
          {steps.map((step, index) => {
            const done = isApplicantPipelineStepCompleted(
              step,
              index,
              activeIndex,
              application.displayStatus,
            );
            const current = index === activeIndex;
            const terminalStep =
              application.displayStatus === APPLICANT_PIPELINE_REJECTED ? "Rejected"
              : application.displayStatus === APPLICANT_PIPELINE_OFFER_DECLINED ? "Offer Declined"
              : null;
            const muted =
              isTerminalNegative && step === terminalStep ? false
              : isTerminalNegative && index > activeIndex;
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
                    <span className="mx-1 hidden h-0.5 min-w-[1rem] flex-1 bg-slate-200 sm:block" aria-hidden />
                  : null}
                </div>
                <span
                  className={`text-[11px] font-medium leading-tight sm:text-xs ${
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
      </section>

      <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Interviews</h2>
        {application.interviews.length === 0 ?
          <p className="mt-3 text-sm text-slate-600">No interviews scheduled for this application yet.</p>
        : <ul className="mt-4 divide-y divide-slate-100">
            {application.interviews.map((interview) => (
              <li
                key={interview.id}
                className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {formatInterviewWhen(
                      interview.scheduledOn,
                      interview.fromTime,
                      interview.toTime,
                    )}
                  </p>
                  {interview.roundOrType ?
                    <p className="text-slate-600">{interview.roundOrType}</p>
                  : null}
                </div>
                <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-900">
                  {interview.status}
                </span>
              </li>
            ))}
          </ul>
        }
      </section>

      <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Offer</h2>
          {application.offer?.canRespond || application.displayStatus === APPLICANT_PIPELINE_OFFER_SENT ?
            <Link
              href={`/applicant/my-offers/${encodeURIComponent(application.offer!.id)}`}
              className="text-sm font-medium text-[#0d4f6e] hover:underline"
            >
              Review & respond →
            </Link>
          : null}
        </div>
        {!application.offer ?
          <p className="mt-3 text-sm text-slate-600">No job offer has been sent for this application yet.</p>
        : <>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Designation</dt>
                <dd className="font-medium text-slate-900">{application.offer.designation}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Offer date</dt>
                <dd className="text-slate-800">{application.offer.offerDate}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Company</dt>
                <dd className="text-slate-800">{application.offer.company}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Offer status</dt>
                <dd>
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                    {jobOfferStatusDisplayLabel(application.offer.status)}
                  </span>
                </dd>
              </div>
            </dl>
            {application.offer.id ?
              <p className="mt-4">
                <Link
                  href={`/applicant/my-offers/${encodeURIComponent(application.offer.id)}`}
                  className={`text-sm font-medium ${accentText} hover:underline`}
                >
                  View full offer details
                </Link>
              </p>
            : null}
          </>
        }
      </section>

      <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Resume</h2>
        {application.resumeAttachment ?
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <a
              href={`/applicant/applications/${encodeURIComponent(application.id)}/resume`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white ${isAemg ? "bg-[#00AEEF] hover:bg-[#0096d1]" : "bg-[#0a1628] hover:bg-[#152a45]"}`}
            >
              View resume
            </a>
            <p className="text-xs text-slate-500">
              Opens the file you submitted with this application.
            </p>
          </div>
        : <p className="mt-3 text-sm text-slate-600">No resume file is attached to this application.</p>}
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
        <Link href="/applicant/my-offers" className={t.backLink}>
          My Offer
        </Link>
        <Link href="/applicant/jobs" className={t.backLink}>
          Browse open roles
        </Link>
      </div>
    </div>
  );
}
