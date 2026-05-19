import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OpeningForm } from "@/components/opening-form";
import { toDesignationOptions } from "@/lib/designation-options";
import {
  fetchERPNextDesignations,
  fetchERPNextEmploymentTypes,
  fetchERPNextJobApplicants,
  fetchERPNextJobOpeningByDocName,
  fetchERPNextJobRequisitions,
  hasERPNextConfig,
  JOB_REQUISITION_STATUS_OPEN_APPROVED,
  jobOpeningRequisitionField,
} from "@/lib/erpnext";
import { readStaffFrappeCookieHeader } from "@/lib/staff-erpnext-session";
import { requireStaffRoles } from "@/lib/staff-session";

export const metadata: Metadata = {
  title: "Edit job opening — Staff",
};

type Props = {
  params: Promise<{ name: string }>;
};

export default async function StaffEditOpeningPage({ params }: Props) {
  await requireStaffRoles(["d_recruiter", "super_admin"]);
  const { name } = await params;
  const decoded = decodeURIComponent(name);

  if (!hasERPNextConfig()) notFound();

  const frappeCookie = await readStaffFrappeCookieHeader();
  const [row, designations, employmentTypes, approvedRequisitions] = await Promise.all([
    fetchERPNextJobOpeningByDocName(decoded),
    fetchERPNextDesignations({ frappeSessionCookie: frappeCookie }),
    fetchERPNextEmploymentTypes(),
    fetchERPNextJobRequisitions({ status: JOB_REQUISITION_STATUS_OPEN_APPROVED }),
  ]);
  if (!row) notFound();

  const applicantsForOpening =
    (await fetchERPNextJobApplicants({
      jobOpeningDocName: decoded,
      limit: 150,
    })) ?? [];

  const designationOptions = toDesignationOptions(designations);
  const currentDesignation = row.designation?.trim();
  if (
    currentDesignation &&
    !designationOptions.some((d) => d.name === currentDesignation)
  ) {
    designationOptions.push({ name: currentDesignation, label: currentDesignation });
    designationOptions.sort((a, b) => a.label.localeCompare(b.label));
  }

  const linkField = jobOpeningRequisitionField();
  const linkedRequisition = String(
    (row as Record<string, unknown>)[linkField] ?? row.job_requisition ?? "",
  ).trim();

  const initial = {
    jobTitle: row.job_title ?? "",
    designation: row.designation ?? "",
    department: row.department ?? "",
    employmentType: row.employment_type ?? "",
    location: row.location ?? "",
    description: row.description ?? "",
    status: row.status === "Closed" ? ("Closed" as const) : ("Open" as const),
    publish: row.publish === 1,
    jobRequisition: linkedRequisition,
  };

  const requisitionOptions = (approvedRequisitions ?? [])
    .filter((r) => r.name?.trim())
    .map((r) => ({
      name: r.name!.trim(),
      label: `${r.designation ?? r.name} (${r.name})`,
    }));
  if (
    linkedRequisition &&
    !requisitionOptions.some((o) => o.name === linkedRequisition)
  ) {
    requisitionOptions.push({ name: linkedRequisition, label: linkedRequisition });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/staff/openings" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          ← Job openings
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Edit opening</h1>
        <p className="mt-1 font-mono text-xs text-slate-500">{decoded}</p>
      </div>
      <OpeningForm
        mode="edit"
        docName={decoded}
        initial={initial}
        designations={designationOptions}
        employmentTypes={(employmentTypes ?? []).map((t) => t.name)}
        jobRequisitionOptions={requisitionOptions}
      />

      <section className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Applicants for this opening</h2>
            <p className="mt-1 text-sm text-slate-600">
              Open an applicant to review their resume, comments, and interviews.
            </p>
          </div>
          <Link
            href={`/staff/applicants?opening=${encodeURIComponent(decoded)}`}
            className="text-sm font-medium text-[#0d4f6e] hover:underline"
          >
            View all in list →
          </Link>
        </div>

        {applicantsForOpening.length === 0 ?
          <p className="mt-4 text-sm text-slate-600">No applicants for this opening yet.</p>
        : <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
            {applicantsForOpening.map((a) => {
              const id = a.name ?? "";
              if (!id) return null;
              return (
                <li key={id}>
                  <Link
                    href={`/staff/applicants/${encodeURIComponent(id)}`}
                    className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm transition hover:bg-slate-50/80"
                  >
                    <span className="font-medium text-[#0d4f6e] hover:underline">
                      {a.applicant_name ?? id}
                    </span>
                    <span className="text-slate-600">{a.email_id ?? "—"}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        }
      </section>
    </div>
  );
}
