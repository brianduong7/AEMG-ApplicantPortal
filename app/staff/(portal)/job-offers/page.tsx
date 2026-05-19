import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { fetchERPNextJobOffersAll, hasERPNextConfig } from "@/lib/erpnext";
import {
  staffCanApproveJobOffers,
  staffHasRecruiterCapabilities,
  staffHasHrCapabilities,
} from "@/lib/staff-roles";
import { requireStaffRoles } from "@/lib/staff-session";

export const metadata: Metadata = {
  title: "Job offers — Staff",
};

type Props = {
  searchParams?: Promise<{ applicant?: string }>;
};

export default async function StaffJobOffersPage({ searchParams }: Props) {
  const { roles } = await requireStaffRoles([
    "d_recruiter",
    "d_hr",
    "d_executive",
    "super_admin",
  ]);
  const isHr = staffHasHrCapabilities(roles);
  const canApproveJobOffers = staffCanApproveJobOffers(roles);
  const canCreateRecruiter = staffHasRecruiterCapabilities(roles);
  const canCreate = canCreateRecruiter || isHr;

  const sp = (await searchParams) ?? {};
  const applicantId =
    typeof sp.applicant === "string" && sp.applicant.trim() ? sp.applicant.trim() : "";

  if (applicantId && canCreateRecruiter) {
    redirect(`/staff/job-offers/new?applicant=${encodeURIComponent(applicantId)}`);
  }

  if (!hasERPNextConfig()) {
    return (
      <div className="flex max-w-2xl flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Job offers</h1>
        <p className="text-sm text-slate-600">Configure the recruitment backend to list job offers.</p>
      </div>
    );
  }

  const rows = (await fetchERPNextJobOffersAll()) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Job offers</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            {canCreateRecruiter && !isHr ?
              "Create draft offers for applicants. HR reviews, submits, and sends offers to candidates."
            : isHr ?
              "Create offers or review recruiter drafts, then submit and send to candidates."
            : "All job offers in the system."}
          </p>
        </div>
        {isHr ?
          <Link
            href="/staff/job-offers/new"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#0a1628] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152a45]"
          >
            Create job offer
          </Link>
        : null}
      </div>

      {rows.length === 0 ?
        <p className="rounded-xl border border-slate-200/80 bg-white p-6 text-sm text-slate-600 shadow-sm">
          No job offers yet.
          {canCreateRecruiter ?
            <>
              {" "}
              Open a{" "}
              <Link href="/staff/applicants" className="font-medium text-[#0d4f6e] hover:underline">
                job applicant
              </Link>{" "}
              and use <strong>Create job offer</strong>, or ask HR to create one from this page.
            </>
          : isHr ?
            <> Use <strong>Create job offer</strong> above.</>
          : null}
        </p>
      : <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Workflow</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Offer date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const docstatus = row.docstatus ?? 0;
                const workflow =
                  docstatus === 1 ? "Submitted"
                  : docstatus === 2 ? "Cancelled"
                  : "Draft";
                const workflowClass =
                  docstatus === 1 ? "bg-blue-100 text-blue-900"
                  : docstatus === 2 ? "bg-slate-200 text-slate-700"
                  : "bg-amber-100 text-amber-900";
                return (
                  <tr key={row.name} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.job_applicant ?
                        <Link
                          href={`/staff/applicants/${encodeURIComponent(row.job_applicant)}`}
                          className="text-[#0d4f6e] hover:underline"
                        >
                          {row.applicant_name ?? row.job_applicant}
                        </Link>
                      : (
                        row.applicant_name ?? "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.designation ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${workflowClass}`}
                      >
                        {workflow}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                        {row.status ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.offer_date ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {row.name ?
                        <Link
                          href={`/staff/job-offers/${encodeURIComponent(row.name)}`}
                          className="text-sm font-medium text-[#0d4f6e] hover:underline"
                        >
                          {canApproveJobOffers ? "Review" : "View"}
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
    </div>
  );
}
