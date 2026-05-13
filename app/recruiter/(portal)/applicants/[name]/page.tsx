import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InterviewScheduleForm } from "@/components/interview-schedule-form";
import {
  fetchERPNextInterviewTypes,
  fetchERPNextJobOpeningsForHr,
  getERPNextJobApplicantOpeningField,
  hasERPNextConfig,
} from "@/lib/erpnext";
import { loadApplicantForRecruiterPortal } from "@/lib/recruiter-applicants";
import { requireRecruiterSession } from "@/lib/recruiter-session";

export const metadata: Metadata = {
  title: "Applicant — Recruiter",
};

type Props = {
  params: Promise<{ name: string }>;
};

function stripHtml(html: string): string {
  return html
    .replace(/\r\n?/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default async function RecruiterApplicantDetailPage({ params }: Props) {
  await requireRecruiterSession();
  const { name } = await params;
  const decoded = decodeURIComponent(name);

  if (!hasERPNextConfig()) notFound();

  const applicant = await loadApplicantForRecruiterPortal(decoded);
  if (!applicant?.name) notFound();

  const openings = await fetchERPNextJobOpeningsForHr();
  const linkField = getERPNextJobApplicantOpeningField();
  const openingId = (applicant as Record<string, string | undefined>)[linkField];
  const openingRow = openings?.find((o) => o.name === openingId);
  const openingTitle = openingRow?.job_title ?? openingId ?? "—";

  const interviewTypes = (await fetchERPNextInterviewTypes()) ?? [];
  const defaultInterviewType = process.env.ERPNEXT_DEFAULT_INTERVIEW_TYPE?.trim();

  const letter = applicant.cover_letter?.trim()
    ? stripHtml(applicant.cover_letter)
    : "";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/recruiter/applicants" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          ← Applicants
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          {applicant.applicant_name ?? "Applicant"}
        </h1>
        <p className="mt-1 font-mono text-xs text-slate-500">{applicant.name}</p>
      </div>

      <section className="grid gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Contact</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-900">{applicant.email_id ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Phone</dt>
              <dd className="text-slate-800">{applicant.phone_number ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd className="text-slate-800">{applicant.status ?? "—"}</dd>
            </div>
          </dl>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Opening</h2>
          <p className="mt-3 text-sm font-medium text-slate-900">{openingTitle}</p>
          {openingId ?
            <p className="mt-1 font-mono text-xs text-slate-500">{openingId}</p>
          : null}
        </div>
      </section>

      {letter ?
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Cover letter</h2>
          <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-800">{letter}</pre>
        </section>
      : null}

      {applicant.resume_attachment ?
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Resume</h2>
          <p className="mt-2 text-sm text-slate-600">
            Private files are served through the portal so your ERPNext session is not required in the
            browser.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href={`/recruiter/applicants/${encodeURIComponent(applicant.name)}/resume`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              View resume
            </a>
            <span className="max-w-full break-all font-mono text-xs text-slate-500">
              {applicant.resume_attachment}
            </span>
          </div>
        </section>
      : null}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <InterviewScheduleForm
          applicantName={applicant.name}
          interviewTypes={interviewTypes}
          defaultInterviewType={defaultInterviewType}
        />
        {interviewTypes.length === 0 && !defaultInterviewType ?
          <p className="mt-4 text-xs text-amber-800">
            No Interview Types returned from ERPNext. Create an Interview Type in HRMS or set{" "}
            <code className="rounded bg-amber-100 px-1">ERPNEXT_DEFAULT_INTERVIEW_TYPE</code>.
          </p>
        : null}
      </section>
    </div>
  );
}
