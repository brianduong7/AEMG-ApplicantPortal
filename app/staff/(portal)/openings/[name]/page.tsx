import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OpeningRecruitmentQuestionsPanel } from "@/components/opening-recruitment-questions-panel";
import { JobDescriptionBox } from "@/components/job-description-box";
import { IconPencil } from "@/components/icons";
import { careerJobPath } from "@/lib/careers";
import { getPublicCareerJobByDocId } from "@/lib/careers-site";
import { getRecruitmentQuestionsForOpening } from "@/lib/job-opening-questions-store";
import {
  demoJobOpeningAsErpRow,
  getDemoJobOpeningById,
} from "@/lib/demo-job-openings";
import { loadJobOpeningForDepartmentManagerView } from "@/lib/department-manager-openings";
import { staffUseDepartmentManagerDataPlane } from "@/lib/staff-data-plane";
import {
  fetchERPNextJobOpeningByDocName,
  hasERPNextConfig,
} from "@/lib/erpnext";
import { requireStaffRoles } from "@/lib/staff-session";
import { staffHasRecruiterCapabilities, staffRolesFromSession } from "@/lib/staff-roles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Job opening — Staff",
};

type Props = {
  params: Promise<{ name: string }>;
};

export default async function StaffOpeningViewPage({ params }: Props) {
  const { session } = await requireStaffRoles([
    "d_recruiter",
    "d_department_manager",
    "d_hr",
    "d_executive",
    "super_admin",
  ]);
  const roles = staffRolesFromSession(session);
  const isDm = staffUseDepartmentManagerDataPlane(session);
  const canEdit = staffHasRecruiterCapabilities(roles);

  const { name } = await params;
  const decoded = decodeURIComponent(name);

  if (!hasERPNextConfig()) notFound();

  const row =
    isDm ?
      await loadJobOpeningForDepartmentManagerView(session.email, decoded)
    : await fetchERPNextJobOpeningByDocName(decoded);
  const demoJob = !row ? getDemoJobOpeningById(decoded) : undefined;
  const displayRow =
    row ??
    (demoJob ? demoJobOpeningAsErpRow(demoJob) : null);
  if (!displayRow) notFound();

  const careerPreview = await getPublicCareerJobByDocId(decoded);
  const recruitmentQuestions = await getRecruitmentQuestionsForOpening(decoded);

  const title = displayRow.job_title ?? displayRow.designation ?? "Job opening";
  const descriptionRaw = displayRow.description?.trim() ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/staff/openings"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Job openings
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-1 font-mono text-xs text-slate-500">{decoded}</p>
          {isDm ?
            <p className="mt-2 text-xs font-medium text-slate-500">View only</p>
          : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {careerPreview ?
            <Link
              href={careerJobPath(careerPreview)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#0096d6]/30 bg-[#0096d6]/5 px-4 py-2 text-sm font-semibold text-[#0077b6] shadow-sm transition hover:bg-[#0096d6]/10"
            >
              View on careers website
            </Link>
          : null}
          {canEdit && !demoJob ?
            <Link
              href={`/staff/openings/${encodeURIComponent(decoded)}/edit`}
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <IconPencil />
              Edit opening
            </Link>
          : null}
        </div>
      </div>

      <div className="flex w-full flex-col gap-6">
        <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Details</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-slate-500">Designation</dt>
              <dd className="mt-0.5 font-medium text-slate-900">{displayRow.designation ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd className="mt-0.5">
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                  {displayRow.status ?? "—"}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Department</dt>
              <dd className="mt-0.5 text-slate-800">{displayRow.department ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Employment type</dt>
              <dd className="mt-0.5 text-slate-800">{displayRow.employment_type ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Location</dt>
              <dd className="mt-0.5 text-slate-800">{displayRow.location ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Company</dt>
              <dd className="mt-0.5 text-slate-800">{displayRow.company ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Published</dt>
              <dd className="mt-0.5 text-slate-800">{displayRow.publish === 1 ? "Yes" : "No"}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Description
          </h2>
          <div className="mt-4">
            {descriptionRaw ?
              <JobDescriptionBox scrollable compact={false} text={descriptionRaw} />
            : <p className="text-sm text-slate-600">No description provided.</p>}
          </div>
        </section>

        <OpeningRecruitmentQuestionsPanel
          jobOpeningId={decoded}
          questions={recruitmentQuestions}
        />

        {!isDm ?
          <Link
            href={`/staff/applicants?opening=${encodeURIComponent(decoded)}`}
            className="text-sm font-medium text-[#0d4f6e] hover:underline"
          >
            View applicants for this opening →
          </Link>
        : null}
      </div>
    </div>
  );
}
