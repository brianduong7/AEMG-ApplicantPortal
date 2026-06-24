import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InterviewActionsPanel } from "@/components/interview-actions-panel";
import { InterviewSummaryForm } from "@/components/interview-summary-form";
import { InterviewTeamsMeetingLink } from "@/components/interview-teams-meeting-link";
import { getDemoInterviewMeetingUrl } from "@/lib/demo-interview-meeting";
import {
  fetchERPNextInterviewByName,
  fetchERPNextInterviewRounds,
  fetchERPNextJobOpeningsForDepartmentManager,
  hasERPNextConfig,
} from "@/lib/erpnext";
import { readStaffFrappeCookieHeader } from "@/lib/staff-erpnext-session";
import { staffUseDepartmentManagerDataPlane } from "@/lib/staff-data-plane";
import {
  staffHasHrCapabilities,
  staffHasRecruiterCapabilities,
  staffRolesFromSession,
} from "@/lib/staff-roles";
import { requireStaffRoles } from "@/lib/staff-session";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `${decodeURIComponent(id)} — Interview`,
    description: "Interview details and recruiter notes.",
  };
}

export default async function StaffInterviewDetailPage({ params }: Props) {
  const { session, roles } = await requireStaffRoles([
    "d_recruiter",
    "d_hr",
    "d_executive",
    "super_admin",
  ]);
  const canManageInterview =
    staffHasRecruiterCapabilities(roles) || staffHasHrCapabilities(roles);
  const canEditSummary = canManageInterview;

  const { id } = await params;
  const interviewName = decodeURIComponent(id);

  if (!hasERPNextConfig() || !interviewName.trim()) notFound();

  const isDm = staffUseDepartmentManagerDataPlane(session);
  const frappeCookie = await readStaffFrappeCookieHeader();
  const interview = await fetchERPNextInterviewByName(interviewName, {
    frappeSessionCookie: frappeCookie,
  });
  if (!interview?.name) notFound();

  if (isDm) {
    const myOpenings = (await fetchERPNextJobOpeningsForDepartmentManager(session.email)) ?? [];
    const openingIds = new Set(
      myOpenings.map((o) => o.name).filter((n): n is string => typeof n === "string" && n.length > 0),
    );
    const jo = interview.job_opening?.trim();
    if (!jo || !openingIds.has(jo)) notFound();
  }

  const usesRound = (await fetchERPNextInterviewRounds()) !== null;
  const roundOrType = usesRound ? interview.interview_round : interview.interview_type;
  const when =
    [interview.scheduled_on, interview.from_time, interview.to_time].filter(Boolean).join(" · ") ||
    "—";
  const applicantId = interview.job_applicant?.trim();
  const teamsMeetingUrl = await getDemoInterviewMeetingUrl(interview.name);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
          <Link href="/staff/interviews" className="font-medium hover:text-slate-900">
            Interviews
          </Link>
          <span aria-hidden>/</span>
          <span className="font-mono text-xs text-slate-500">{interview.name}</span>
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Interview</h1>
        <p className="mt-1 text-sm text-slate-600">
          Share the Teams link below with the candidate. The link is a placeholder until live
          Microsoft Teams integration is enabled.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Teams meeting
        </h2>
        <div className="mt-4">
          <InterviewTeamsMeetingLink meetingUrl={teamsMeetingUrl} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Details</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd className="mt-0.5">
              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                {interview.status ?? "—"}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Scheduled</dt>
            <dd className="mt-0.5 font-medium text-slate-900">{when}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{usesRound ? "Interview round" : "Interview type"}</dt>
            <dd className="mt-0.5 text-slate-800">{roundOrType ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Job applicant</dt>
            <dd className="mt-0.5">
              {applicantId ?
                <Link
                  href={`/staff/applicants/${encodeURIComponent(applicantId)}`}
                  className="font-medium text-[#0d4f6e] hover:underline"
                >
                  {applicantId}
                </Link>
              : "—"}
            </dd>
          </div>
        </dl>
      </section>

      {canManageInterview ?
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Actions
          </h2>
          <div className="mt-4">
            <InterviewActionsPanel
              docName={interview.name}
              status={interview.status}
              docstatus={interview.docstatus}
              scheduledOn={interview.scheduled_on}
              fromTime={interview.from_time}
              toTime={interview.to_time}
            />
          </div>
        </section>
      : null}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Interview summary
        </h2>
        {canEditSummary ?
          <div className="mt-4">
            <InterviewSummaryForm
              docName={interview.name}
              initialSummary={interview.interview_summary?.trim() ?? ""}
            />
          </div>
        : interview.interview_summary?.trim() ?
          <pre className="mt-4 whitespace-pre-wrap text-sm text-slate-800">
            {interview.interview_summary.trim()}
          </pre>
        : <p className="mt-4 text-sm text-slate-600">No summary yet.</p>}
      </section>
    </div>
  );
}
