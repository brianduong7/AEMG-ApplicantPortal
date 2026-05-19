import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { JobRequisitionApproveButton } from "@/components/job-requisition-approve-button";
import {
  fetchERPNextJobRequisitionByName,
  hasERPNextConfig,
  JOB_REQUISITION_STATUS_OPEN_APPROVED,
  JOB_REQUISITION_STATUS_PENDING,
  jobRequisitionUserField,
} from "@/lib/erpnext";
import { linkedOpeningSummariesForRequisition } from "@/lib/job-requisition-linked-openings";
import { STAFF_PORTAL_BASE } from "@/lib/staff-portal-base";
import {
  staffHasExecutiveCapabilities,
  staffHasRecruiterCapabilities,
  staffUseScopedDepartmentManagerDataPlane,
} from "@/lib/staff-roles";
import { requireStaffRoles } from "@/lib/staff-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Job requisition — Staff",
};

type Props = {
  params: Promise<{ id: string }>;
};

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{value}</dd>
    </div>
  );
}

export default async function StaffJobRequisitionDetailPage({ params }: Props) {
  const { session, roles } = await requireStaffRoles([
    "d_department_manager",
    "d_recruiter",
    "d_hr",
    "d_executive",
    "super_admin",
  ]);

  const { id } = await params;
  const docName = decodeURIComponent(id).trim();
  if (!docName || !hasERPNextConfig()) notFound();

  const requisition = await fetchERPNextJobRequisitionByName(docName);
  if (!requisition) notFound();

  const isDmOnly = staffUseScopedDepartmentManagerDataPlane(roles);
  const canApprove = staffHasExecutiveCapabilities(roles);
  const hasRecruiterRole = staffHasRecruiterCapabilities(roles);

  if (isDmOnly) {
    const requestedBy =
      requisition.requested_by?.trim() ||
      String((requisition as Record<string, unknown>)[jobRequisitionUserField()] ?? "").trim();
    if (requestedBy && requestedBy.toLowerCase() !== session.email.trim().toLowerCase()) {
      notFound();
    }
  }

  const linkedOpenings = await linkedOpeningSummariesForRequisition(docName);
  const status = requisition.status ?? "—";
  const isPending = status === JOB_REQUISITION_STATUS_PENDING;
  const isApproved = status === JOB_REQUISITION_STATUS_OPEN_APPROVED;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href={`${STAFF_PORTAL_BASE}/job-requisitions`}
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Job requisitions
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {requisition.designation ?? docName}
            </h1>
            <p className="mt-1 text-sm text-slate-600">{docName}</p>
          </div>
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-800">
            {status}
          </span>
        </div>
        {canApprove && isPending ?
          <div className="mt-4">
            <JobRequisitionApproveButton docName={docName} />
          </div>
        : null}
      </div>

      <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Requisition details
        </h2>
        <dl className="mt-4 flex flex-col gap-3">
          <DetailRow label="Designation" value={requisition.designation ?? "—"} />
          <DetailRow label="Department" value={requisition.department ?? "—"} />
          <DetailRow label="Positions" value={requisition.no_of_positions ?? "—"} />
          {!isDmOnly ?
            <>
              <DetailRow
                label="Expected compensation"
                value={requisition.expected_compensation ?? "—"}
              />
              <DetailRow label="Company" value={requisition.company ?? "—"} />
              <DetailRow label="Posting date" value={requisition.posting_date ?? "—"} />
              <DetailRow label="Expected by" value={requisition.expected_by ?? "—"} />
              <DetailRow label="Requested by" value={requisition.requested_by ?? "—"} />
            </>
          : null}
        </dl>
        {!isDmOnly && requisition.description?.trim() ?
          <div className="mt-6 border-t border-slate-100 pt-6">
            <h3 className="text-sm font-medium text-slate-700">Job description</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
              {requisition.description}
            </p>
          </div>
        : null}
      </section>

      <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Linked job opening</h2>
            <p className="mt-1 text-sm text-slate-600">
              {isDmOnly ?
                "Progress for openings created from this requisition."
              : "Openings tied to this requisition in the system."}
            </p>
          </div>
          {hasRecruiterRole && isApproved && linkedOpenings.length === 0 ?
            <Link
              href={`${STAFF_PORTAL_BASE}/openings/new?requisition=${encodeURIComponent(docName)}`}
              className="inline-flex items-center justify-center rounded-lg bg-[#E8961E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#d48618]"
            >
              Create job opening
            </Link>
          : null}
        </div>

        {linkedOpenings.length === 0 ?
          <p className="mt-4 text-sm text-slate-600">
            {isApproved ?
              "No job opening linked yet."
            : "An opening can be created after this requisition is approved."}
          </p>
        : <div className="mt-4 overflow-hidden rounded-lg border border-slate-100">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Opening</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Published</th>
                  <th className="px-4 py-3">Applicants</th>
                  {!isDmOnly ?
                    <th className="px-4 py-3 text-right">View</th>
                  : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {linkedOpenings.map((opening) => (
                  <tr key={opening.docName || opening.title}>
                    <td className="px-4 py-3 font-medium text-slate-900">{opening.title}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                        {opening.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {opening.published ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{opening.applicantCount}</td>
                    {!isDmOnly && opening.docName ?
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`${STAFF_PORTAL_BASE}/openings/${encodeURIComponent(opening.docName)}`}
                          className="text-sm font-medium text-[#0d4f6e] hover:underline"
                        >
                          Open
                        </Link>
                      </td>
                    : !isDmOnly ?
                      <td className="px-4 py-3 text-right text-slate-400">—</td>
                    : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </section>
    </div>
  );
}
