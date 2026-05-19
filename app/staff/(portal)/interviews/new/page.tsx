import type { Metadata } from "next";
import Link from "next/link";
import { InterviewCreateForm } from "@/components/interview-create-form";
import {
  fetchERPNextInterviewRounds,
  fetchERPNextInterviewTypes,
  fetchERPNextJobApplicants,
  fetchERPNextJobOpeningsForHr,
  getERPNextJobApplicantOpeningField,
  hasERPNextConfig,
} from "@/lib/erpnext";
import { staffHasRecruiterCapabilities, staffRolesFromSession } from "@/lib/staff-roles";
import { requireStaffRoles } from "@/lib/staff-session";

export const metadata: Metadata = {
  title: "New interview — Staff",
};

type Props = {
  searchParams?: Promise<{ applicant?: string }>;
};

export default async function StaffNewInterviewPage({ searchParams }: Props) {
  const { roles } = await requireStaffRoles([
    "d_recruiter",
    "d_hr",
    "d_executive",
    "super_admin",
  ]);

  if (!staffHasRecruiterCapabilities(roles)) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">New interview</h1>
        <p className="mt-2 text-sm text-slate-600">You do not have permission to schedule interviews.</p>
      </div>
    );
  }

  if (!hasERPNextConfig()) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">New interview</h1>
        <p className="mt-2 text-sm text-slate-600">Recruitment backend is not configured.</p>
      </div>
    );
  }

  const sp = (await searchParams) ?? {};
  const preselectedApplication =
    typeof sp.applicant === "string" && sp.applicant.trim() ? sp.applicant.trim() : undefined;

  const openingField = getERPNextJobApplicantOpeningField();

  const [applicants, interviewRounds, interviewTypes, jobOpenings] = await Promise.all([
    fetchERPNextJobApplicants({ limit: 500 }),
    fetchERPNextInterviewRounds(),
    fetchERPNextInterviewTypes(),
    fetchERPNextJobOpeningsForHr(),
  ]);

  const openingLabelById = new Map<string, string>();
  for (const o of jobOpenings ?? []) {
    const id = o.name?.trim();
    if (!id) continue;
    const title = o.job_title?.trim();
    openingLabelById.set(id, title || id);
  }

  const interviewLinkMode = interviewRounds !== null ? "round" : "type";
  const applicationOptions = (applicants ?? [])
    .map((a) => {
      const name = a.name?.trim();
      if (!name) return null;
      const label = [a.applicant_name, a.email_id].filter(Boolean).join(" · ") || name;
      const row = a as Record<string, unknown>;
      const jobOpeningId =
        typeof row[openingField] === "string" ? row[openingField].trim() : undefined;
      const jobOpeningLabel =
        jobOpeningId ? openingLabelById.get(jobOpeningId) ?? jobOpeningId : undefined;
      return { name, label, jobOpeningId, jobOpeningLabel };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null)
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/staff/interviews" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          ← Interviews
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">New interview</h1>
        <p className="mt-1 text-sm text-slate-600">
          Schedule an interview and add optional notes. Meetings run in Microsoft Teams outside this
          app.
        </p>
      </div>

      <InterviewCreateForm
        applications={applicationOptions}
        interviewLinkMode={interviewLinkMode}
        interviewRounds={interviewRounds ?? []}
        interviewTypes={(interviewTypes ?? []).map((t) => ({
          name: t.name,
          description: t.description,
        }))}
        defaultInterviewRound={process.env.ERPNEXT_DEFAULT_INTERVIEW_ROUND?.trim()}
        defaultInterviewType={process.env.ERPNEXT_DEFAULT_INTERVIEW_TYPE?.trim()}
        preselectedApplication={preselectedApplication}
      />
    </div>
  );
}
