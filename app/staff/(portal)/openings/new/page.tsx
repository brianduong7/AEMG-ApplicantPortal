import type { Metadata } from "next";
import Link from "next/link";
import { OpeningForm } from "@/components/opening-form";
import { toDesignationOptions } from "@/lib/designation-options";
import {
  fetchERPNextDesignations,
  fetchERPNextEmploymentTypes,
  fetchERPNextJobRequisitionByName,
  fetchERPNextJobRequisitions,
  hasERPNextConfig,
  JOB_REQUISITION_STATUS_OPEN_APPROVED,
} from "@/lib/erpnext";
import { readStaffFrappeCookieHeader } from "@/lib/staff-erpnext-session";
import {
  getDefaultPoolQuestions,
  getOptionalPoolQuestions,
} from "@/lib/job-opening-questions-demo";
import { requireStaffRoles } from "@/lib/staff-session";

export const metadata: Metadata = {
  title: "New job opening — Staff",
};

type Props = {
  searchParams: Promise<{ requisition?: string }>;
};

export default async function StaffNewOpeningPage({ searchParams }: Props) {
  await requireStaffRoles(["d_recruiter", "super_admin"]);

  if (!hasERPNextConfig()) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">New opening</h1>
        <p className="mt-2 text-sm text-slate-600">
          Recruitment backend is not configured. Contact your administrator.
        </p>
        <Link href="/staff/openings" className="mt-4 inline-block text-sm font-medium text-slate-900 underline">
          ← Back to openings
        </Link>
      </div>
    );
  }

  const sp = await searchParams;
  const requisitionId = sp.requisition?.trim() ?? "";

  const frappeCookie = await readStaffFrappeCookieHeader();
  const [designations, employmentTypes, approvedRequisitions, linkedRequisition] =
    await Promise.all([
      fetchERPNextDesignations({ frappeSessionCookie: frappeCookie }),
      fetchERPNextEmploymentTypes(),
      fetchERPNextJobRequisitions({ status: JOB_REQUISITION_STATUS_OPEN_APPROVED }),
      requisitionId ?
        fetchERPNextJobRequisitionByName(requisitionId)
      : Promise.resolve(null),
    ]);

  const requisitionOptions = (approvedRequisitions ?? [])
    .filter((r) => r.name?.trim())
    .map((r) => ({
      name: r.name!.trim(),
      label: `${r.designation ?? r.name} (${r.name})`,
    }));

  const lockedRequisition =
    linkedRequisition?.status === JOB_REQUISITION_STATUS_OPEN_APPROVED ?
      requisitionId
    : undefined;

  const designationFromReq = linkedRequisition?.designation?.trim() ?? "";
  const initial =
    lockedRequisition ?
      {
        jobTitle: designationFromReq,
        designation: designationFromReq,
        department: linkedRequisition?.department?.trim() ?? "",
        description: linkedRequisition?.description?.trim() ?? "",
        jobRequisition: lockedRequisition,
      }
    : undefined;

  const defaultQuestions = getDefaultPoolQuestions();
  const optionalQuestions = getOptionalPoolQuestions();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/staff/openings" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          ← Job openings
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">New job opening</h1>
        <p className="mt-1 text-sm text-slate-600">
          Publish a new role to your careers site and start receiving applications.
          {lockedRequisition ?
            " This opening will be linked to the selected job requisition."
          : null}
        </p>
      </div>
      <OpeningForm
        mode="create"
        designations={toDesignationOptions(designations)}
        employmentTypes={(employmentTypes ?? []).map((t) => t.name)}
        jobRequisitionOptions={requisitionOptions}
        lockedJobRequisition={lockedRequisition}
        initial={initial}
        defaultQuestions={defaultQuestions}
        optionalQuestions={optionalQuestions}
      />
    </div>
  );
}
