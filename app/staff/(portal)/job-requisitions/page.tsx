import type { Metadata } from "next";
import Link from "next/link";
import { JobRequisitionApproveButton } from "@/components/job-requisition-approve-button";
import {
  fetchERPNextJobRequisitions,
  hasERPNextConfig,
  JOB_REQUISITION_STATUS_OPEN_APPROVED,
  JOB_REQUISITION_STATUS_PENDING,
} from "@/lib/erpnext";
import { STAFF_PORTAL_BASE } from "@/lib/staff-portal-base";
import {
  staffCanCreateJobRequisitions,
  staffHasExecutiveCapabilities,
  staffHasHrCapabilities,
  staffHasRecruiterCapabilities,
} from "@/lib/staff-roles";
import { requireStaffRoles } from "@/lib/staff-session";

export const metadata: Metadata = {
  title: "Job requisitions — Staff",
};

export default async function StaffJobRequisitionsPage() {
  const { session, roles } = await requireStaffRoles([
    "d_department_manager",
    "d_recruiter",
    "d_hr",
    "d_executive",
    "super_admin",
  ]);

  const canCreate = staffCanCreateJobRequisitions(roles);
  const hasRecruiterRole = staffHasRecruiterCapabilities(roles);
  const canApprove = staffHasExecutiveCapabilities(roles);
  const showAll =
    !hasRecruiterRole &&
    (staffHasHrCapabilities(roles) ||
      staffHasExecutiveCapabilities(roles) ||
      roles.includes("super_admin"));

  if (!hasERPNextConfig()) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Job requisitions</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-600">
          Configure API credentials to load requisitions.
        </p>
      </div>
    );
  }

  let rows: Awaited<ReturnType<typeof fetchERPNextJobRequisitions>> = [];

  if (hasRecruiterRole) {
    rows =
      (await fetchERPNextJobRequisitions({
        status: JOB_REQUISITION_STATUS_OPEN_APPROVED,
      })) ?? [];
  } else if (showAll) {
    rows = (await fetchERPNextJobRequisitions({})) ?? [];
  } else {
    rows = (await fetchERPNextJobRequisitions({ requestedBy: session.email })) ?? [];
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Job requisitions</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            {hasRecruiterRole ?
              "Open & approved requisitions you can use to create job openings."
            : showAll ?
              "All requisitions in the system."
            : "Requisitions you requested. Open a row to see linked job opening progress."}
          </p>
        </div>
        {canCreate ?
          <Link
            href={`${STAFF_PORTAL_BASE}/job-requisitions/new`}
            className="inline-flex items-center justify-center rounded-lg bg-[#E8961E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#d48618]"
          >
            New requisition
          </Link>
        : null}
      </div>

      {rows.length === 0 ?
        <p className="rounded-xl border border-slate-200/80 bg-white p-6 text-sm text-slate-600 shadow-sm">
          No job requisitions in your scope.
        </p>
      : <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Requisition</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Positions</th>
                <th className="px-4 py-3">Status</th>
                {canApprove ?
                  <th className="px-4 py-3 text-right">Actions</th>
                : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const id = row.name ?? "";
                const status = row.status ?? "—";
                const isPending = status === JOB_REQUISITION_STATUS_PENDING;
                return (
                  <tr key={id || String(row.designation)} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {id ?
                        <Link
                          href={`${STAFF_PORTAL_BASE}/job-requisitions/${encodeURIComponent(id)}`}
                          className="text-[#0d4f6e] hover:underline"
                        >
                          {row.designation ?? id}
                        </Link>
                      : (row.designation ?? "—")}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.department ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{row.no_of_positions ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                        {status}
                      </span>
                    </td>
                    {canApprove ?
                      <td className="px-4 py-3 text-right">
                        {isPending && id ?
                          <JobRequisitionApproveButton docName={id} />
                        : <span className="text-xs text-slate-400">—</span>}
                      </td>
                    : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      }
    </div>
  );
}
