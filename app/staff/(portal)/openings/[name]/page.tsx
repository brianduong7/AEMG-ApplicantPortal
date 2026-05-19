import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobDescriptionBox } from "@/components/job-description-box";
import { IconPencil } from "@/components/icons";
import { careerJobPath, getCareerJobByDocId } from "@/lib/careers";
import {
  fetchERPNextJobOpeningByDocName,
  hasERPNextConfig,
} from "@/lib/erpnext";
import { normalizeJobDescriptionForEditor } from "@/lib/job-description-html";
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
    "d_hr",
    "d_executive",
    "super_admin",
  ]);
  const canEdit = staffHasRecruiterCapabilities(staffRolesFromSession(session));

  const { name } = await params;
  const decoded = decodeURIComponent(name);

  if (!hasERPNextConfig()) notFound();

  const [row, careerPreview] = await Promise.all([
    fetchERPNextJobOpeningByDocName(decoded),
    getCareerJobByDocId(decoded),
  ]);
  if (!row) notFound();

  const title = row.job_title ?? row.designation ?? "Job opening";
  const descriptionHtml = normalizeJobDescriptionForEditor(row.description ?? "");

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
          {canEdit ?
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

      <div className="grid max-w-3xl gap-6">
        <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Details</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-slate-500">Designation</dt>
              <dd className="mt-0.5 font-medium text-slate-900">{row.designation ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd className="mt-0.5">
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                  {row.status ?? "—"}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Department</dt>
              <dd className="mt-0.5 text-slate-800">{row.department ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Employment type</dt>
              <dd className="mt-0.5 text-slate-800">{row.employment_type ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Location</dt>
              <dd className="mt-0.5 text-slate-800">{row.location ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Published</dt>
              <dd className="mt-0.5 text-slate-800">{row.publish === 1 ? "Yes" : "No"}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Description
          </h2>
          <div className="mt-4">
            <JobDescriptionBox
              text="No description provided."
              html={descriptionHtml || undefined}
            />
          </div>
        </section>

        <Link
          href={`/staff/applicants?opening=${encodeURIComponent(decoded)}`}
          className="text-sm font-medium text-[#0d4f6e] hover:underline"
        >
          View applicants for this opening →
        </Link>
      </div>
    </div>
  );
}
