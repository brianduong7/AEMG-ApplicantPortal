import type { Metadata } from "next";
import Link from "next/link";
import { OpeningRowActions } from "@/components/opening-row-actions";
import {
  fetchERPNextJobOpeningsForDepartmentManager,
  fetchERPNextJobOpeningsForHr,
  hasERPNextConfig,
} from "@/lib/erpnext";
import { staffUseDepartmentManagerDataPlane } from "@/lib/staff-data-plane";
import { staffHasRecruiterCapabilities, staffRolesFromSession } from "@/lib/staff-roles";
import { requireStaffRoles } from "@/lib/staff-session";

export const metadata: Metadata = {
  title: "Job openings — Staff",
};

export default async function StaffOpeningsPage() {
  const { session } = await requireStaffRoles([
    "d_recruiter",
    "d_department_manager",
    "d_hr",
    "d_executive",
    "super_admin",
  ]);

  const isDm = staffUseDepartmentManagerDataPlane(session);
  const canEdit = staffHasRecruiterCapabilities(staffRolesFromSession(session));

  if (!hasERPNextConfig()) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Job openings</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-600">
          Recruitment backend is not configured. Contact your administrator.
        </p>
      </div>
    );
  }

  if (isDm) {
    const rows = (await fetchERPNextJobOpeningsForDepartmentManager(session.email)) ?? [];

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Job openings</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            View openings in your scope and roles linked to your job requisitions (read-only).
          </p>
        </div>

        {rows.length === 0 ?
          <p className="rounded-xl border border-slate-200/80 bg-white p-6 text-sm text-slate-600 shadow-sm">
            No job openings in your scope yet.
          </p>
        : <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const id = row.name ?? "";
                  const title = row.job_title ?? row.designation ?? "Untitled";
                  return (
                    <tr key={id || title} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {id ?
                          <Link
                            href={`/staff/openings/${encodeURIComponent(id)}`}
                            className="text-[#0d4f6e] hover:underline"
                          >
                            {title}
                          </Link>
                        : title}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.designation ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                          {row.status ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {id ?
                          <OpeningRowActions openingId={id} canEdit={false} viewOnly />
                        : null}
                      </td>
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

  const rows = await fetchERPNextJobOpeningsForHr();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Job openings</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage published roles and track applicants per opening.
          </p>
        </div>
        {canEdit ?
          <Link
            href="/staff/openings/new"
            className="inline-flex w-fit items-center justify-center rounded-lg bg-[#0a1628] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152a45]"
          >
            New opening
          </Link>
        : null}
      </div>

      {!rows || rows.length === 0 ?
        <p className="rounded-xl border border-slate-200/80 bg-white p-6 text-sm text-slate-600 shadow-sm">
          No job openings yet.{" "}
          {canEdit ?
            <>
              <Link href="/staff/openings/new" className="font-medium text-[#0d4f6e] hover:underline">
                Create your first opening
              </Link>
              .
            </>
          : null}
        </p>
      : <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const id = row.name ?? "";
                const title = row.job_title ?? row.designation ?? "Untitled";
                return (
                  <tr key={id || title} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {id ?
                        <Link
                          href={`/staff/openings/${encodeURIComponent(id)}`}
                          className="text-[#0d4f6e] hover:underline"
                        >
                          {title}
                        </Link>
                      : (
                        title
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.designation ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                        {row.status ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {id ?
                        <OpeningRowActions openingId={id} canEdit={canEdit} />
                      : null}
                    </td>
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
