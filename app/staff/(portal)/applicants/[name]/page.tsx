import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicantCommentForm } from "@/components/applicant-comment-form";
import { ApplicantDetailSection } from "@/components/applicant-detail-section";
import { InterviewScheduleForm } from "@/components/interview-schedule-form";
import {
  fetchERPNextCommentsForDocument,
  fetchERPNextInterviewRounds,
  fetchERPNextInterviewTypes,
  fetchERPNextInterviewsForJobApplicant,
  fetchERPNextJobOffersForJobApplicants,
  fetchERPNextJobOpeningsForHr,
  getERPNextJobApplicantOpeningField,
  hasERPNextConfig,
  type ERPNextCommentRow,
} from "@/lib/erpnext";
import { loadApplicantForRecruiterPortal } from "@/lib/recruiter-applicants";
import { readStaffFrappeCookieHeader } from "@/lib/staff-erpnext-session";
import { staffHasRecruiterCapabilities, staffRolesFromSession } from "@/lib/staff-roles";
import { requireStaffRoles } from "@/lib/staff-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Applicant — Staff",
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
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatCommentWhen(iso?: string): string {
  if (!iso?.trim()) return "";
  const d = new Date(iso.trim());
  if (Number.isNaN(d.getTime())) return iso.trim().slice(0, 16);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function commentAuthor(row: ERPNextCommentRow): string {
  return row.comment_by?.trim() || row.owner?.trim() || "System";
}

function CommentBlock({ row }: { row: ERPNextCommentRow }) {
  const body = row.content?.trim() ? stripHtml(row.content) : "";
  const when = formatCommentWhen(row.creation);
  return (
    <article className="rounded-lg border border-slate-100 bg-slate-50/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="font-medium text-slate-700">{commentAuthor(row)}</span>
        {when ? <time dateTime={row.creation}>{when}</time> : null}
      </div>
      {body ?
        <pre className="mt-3 min-h-[7.5rem] max-h-[24rem] resize-y overflow-y-auto whitespace-pre-wrap rounded-md border border-slate-200/80 bg-white p-3 text-sm leading-relaxed text-slate-800">
          {body}
        </pre>
      : <p className="mt-3 text-sm text-slate-600">(No text)</p>}
    </article>
  );
}

export default async function StaffApplicantDetailPage({ params }: Props) {
  const { roles } = await requireStaffRoles([
    "d_recruiter",
    "d_hr",
    "d_executive",
    "super_admin",
  ]);
  const canRecruit = staffHasRecruiterCapabilities(roles);

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

  const interviewRounds = await fetchERPNextInterviewRounds();
  const interviewTypes = (await fetchERPNextInterviewTypes()) ?? [];
  const interviewLinkMode = interviewRounds !== null ? "round" : "type";
  const roundsList = interviewRounds ?? [];
  const defaultInterviewRound = process.env.ERPNEXT_DEFAULT_INTERVIEW_ROUND?.trim();
  const defaultInterviewType = process.env.ERPNEXT_DEFAULT_INTERVIEW_TYPE?.trim();

  const frappeCookie = await readStaffFrappeCookieHeader();
  const [applicantInterviews, timelineComments, jobOffers] = await Promise.all([
    fetchERPNextInterviewsForJobApplicant(applicant.name, {
      frappeSessionCookie: frappeCookie,
    }),
    fetchERPNextCommentsForDocument("Job Applicant", applicant.name),
    fetchERPNextJobOffersForJobApplicants([applicant.name]),
  ]);

  const interviews = applicantInterviews ?? [];
  const deskComments = (timelineComments ?? []).filter(
    (row) => (row.comment_type?.trim() || "Comment") === "Comment",
  );
  const offers = jobOffers ?? [];

  const letter = applicant.cover_letter?.trim() ? stripHtml(applicant.cover_letter) : "";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/staff/applicants" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          ← Applicants
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          {applicant.applicant_name ?? "Applicant"}
        </h1>
        <p className="mt-1 font-mono text-xs text-slate-500">{applicant.name}</p>
      </div>

      <ApplicantDetailSection title="Contact">
        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd className="mt-0.5 font-medium text-slate-900">{applicant.email_id ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Phone</dt>
            <dd className="mt-0.5 text-slate-800">{applicant.phone_number ?? "—"}</dd>
          </div>
        </dl>
      </ApplicantDetailSection>

      <ApplicantDetailSection
        title="Application"
        description="Role and pipeline status."
      >
        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-slate-500">Job opening</dt>
            <dd className="mt-0.5 font-medium text-slate-900">{openingTitle}</dd>
            {openingId ?
              <dd className="mt-0.5 font-mono text-xs text-slate-500">{openingId}</dd>
            : null}
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd className="mt-0.5">
              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                {applicant.status ?? "—"}
              </span>
            </dd>
          </div>
          {applicant.designation ?
            <div>
              <dt className="text-slate-500">Designation</dt>
              <dd className="mt-0.5 text-slate-800">{applicant.designation}</dd>
            </div>
          : null}
        </dl>
      </ApplicantDetailSection>

      <ApplicantDetailSection
        title="Comments"
        description="Notes on this applicant (AI shortlisting and recruiter comments). Attachments and other activity are not shown here."
      >
        {deskComments.length === 0 ?
          <p className="text-sm text-slate-600">No comments yet.</p>
        : <ul className="flex flex-col gap-3">
            {deskComments.map((row) => (
              <li key={row.name ?? row.creation}>
                <CommentBlock row={row} />
              </li>
            ))}
          </ul>
        }
        <ApplicantCommentForm applicantDocName={applicant.name} />
      </ApplicantDetailSection>

      {letter ?
        <ApplicantDetailSection title="Cover letter">
          <pre className="whitespace-pre-wrap text-sm text-slate-800">{letter}</pre>
        </ApplicantDetailSection>
      : null}

      <ApplicantDetailSection
        title="Resume"
        description="Resume file attached to this application."
      >
        {applicant.resume_attachment ?
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`/staff/applicants/${encodeURIComponent(applicant.name)}/resume`}
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
        : <p className="text-sm text-slate-600">No resume file attached.</p>}
      </ApplicantDetailSection>

      <ApplicantDetailSection
        title="Interviews"
        description="Scheduled interviews and new bookings for this applicant."
        action={
          <Link href="/staff/interviews" className="text-xs font-medium text-[#0d4f6e] hover:underline">
            All interviews
          </Link>
        }
      >
        {interviews.length === 0 ?
          <p className="text-sm text-slate-600">No interviews scheduled yet.</p>
        : <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">When</th>
                  <th className="px-3 py-2.5">Round / type</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {interviews.map((row, idx) => (
                  <tr key={row.name ? row.name : `interview-${idx}`} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-800">
                      {[row.scheduled_on, row.from_time, row.to_time].filter(Boolean).join(" · ") ||
                        "—"}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {row.interview_round ?? row.interview_type ?? "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                        {row.status ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {row.name ?
                        <Link
                          href={`/staff/interviews/${encodeURIComponent(row.name)}`}
                          className="font-medium text-[#0d4f6e] hover:underline"
                        >
                          View
                        </Link>
                      : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }

        {canRecruit ?
          <div className="mt-6 border-t border-slate-100 pt-6">
            <h3 className="text-sm font-semibold text-slate-900">Schedule interview</h3>
            <p className="mt-1 text-xs text-slate-500">
              Books an interview for this applicant in the recruitment system.
            </p>
            <div className="mt-4">
              <InterviewScheduleForm
                embedded
                applicantName={applicant.name}
                interviewLinkMode={interviewLinkMode}
                interviewRounds={roundsList}
                interviewTypes={interviewTypes}
                defaultInterviewRound={defaultInterviewRound}
                defaultInterviewType={defaultInterviewType}
              />
            </div>
            {interviewLinkMode === "round" && roundsList.length === 0 && !defaultInterviewRound ?
              <p className="mt-4 text-xs text-amber-800">
                No interview rounds are configured. Ask your administrator to add interview rounds or
                set <code className="rounded bg-amber-100 px-1">ERPNEXT_DEFAULT_INTERVIEW_ROUND</code>.
              </p>
            : null}
            {interviewLinkMode === "type" && interviewTypes.length === 0 && !defaultInterviewType ?
              <p className="mt-4 text-xs text-amber-800">
                No interview types are configured. Ask your administrator to add interview types or set{" "}
                <code className="rounded bg-amber-100 px-1">ERPNEXT_DEFAULT_INTERVIEW_TYPE</code>.
              </p>
            : null}
          </div>
        : null}
      </ApplicantDetailSection>

      <ApplicantDetailSection
        title="Job offers"
        description="Offers linked to this job applicant."
      >
        {offers.length === 0 ?
          <p className="text-sm text-slate-600">No job offers for this applicant yet.</p>
        : <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Designation</th>
                  <th className="px-3 py-2.5">Workflow</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Offer date</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {offers.map((offer) => {
                  const docstatus = offer.docstatus ?? 0;
                  const workflow =
                    docstatus === 1 ? "Submitted"
                    : docstatus === 2 ? "Cancelled"
                    : "Draft";
                  return (
                    <tr key={offer.name} className="hover:bg-slate-50/80">
                      <td className="px-3 py-2.5 font-medium text-slate-900">
                        {offer.designation ?? offer.name ?? "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                          {workflow}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                          {offer.status ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">{offer.offer_date ?? "—"}</td>
                      <td className="px-3 py-2.5 text-right">
                        {offer.name ?
                          <Link
                            href={`/staff/job-offers/${encodeURIComponent(offer.name)}`}
                            className="text-sm font-medium text-[#0d4f6e] hover:underline"
                          >
                            View
                          </Link>
                        : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        }

        {canRecruit ?
          <div className="mt-6 border-t border-slate-100 pt-6">
            <Link
              href={`/staff/job-offers/new?applicant=${encodeURIComponent(applicant.name)}`}
              className="inline-flex items-center justify-center rounded-lg bg-[#0a1628] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152a45]"
            >
              Create job offer
            </Link>
          </div>
        : null}
      </ApplicantDetailSection>
    </div>
  );
}
