import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { JobRequisitionCreateForm } from "@/components/job-requisition-create-form";
import { STAFF_PORTAL_BASE } from "@/lib/staff-portal-base";
import { staffCanCreateJobRequisitions, staffRolesFromSession } from "@/lib/staff-roles";
import { requireStaffRoles } from "@/lib/staff-session";

export const metadata: Metadata = {
  title: "New job requisition — Staff",
};

export default async function NewJobRequisitionPage() {
  const { session } = await requireStaffRoles(["d_department_manager", "super_admin"]);
  const roles = staffRolesFromSession(session);
  if (!staffCanCreateJobRequisitions(roles)) {
    redirect(`${STAFF_PORTAL_BASE}/job-requisitions`);
  }
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`${STAFF_PORTAL_BASE}/job-requisitions`}
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Job requisitions
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          New job requisition
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Creates a requisition in the system with status <strong>Pending</strong>. An executive can
          approve it to <strong>Open &amp; Approved</strong> for recruiters.
        </p>
      </div>
      <JobRequisitionCreateForm defaultPostingDate={today} />
    </div>
  );
}
