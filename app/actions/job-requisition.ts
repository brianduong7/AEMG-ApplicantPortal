"use server";

import { revalidatePath } from "next/cache";
import {
  createERPNextJobRequisition,
  JOB_REQUISITION_STATUS_OPEN_APPROVED,
  JOB_REQUISITION_STATUS_REJECTED,
  resolveJobRequisitionRequesterForCreate,
  updateERPNextJobRequisitionStatus,
} from "@/lib/erpnext";
import { getSession } from "@/lib/session";
import {
  staffCanCreateJobRequisitions,
  staffHasExecutiveCapabilities,
  staffRolesFromSession,
} from "@/lib/staff-roles";
import { STAFF_PORTAL_BASE } from "@/lib/staff-portal-base";
import { userFacingError } from "@/lib/user-facing-copy";

export type JobRequisitionFormState = { error?: string; ok?: string } | null;

export async function createJobRequisition(
  _prev: JobRequisitionFormState,
  formData: FormData,
): Promise<JobRequisitionFormState> {
  const session = await getSession();
  if (!session) return { error: "Sign in required." };

  const roles = staffRolesFromSession(session);
  if (!staffCanCreateJobRequisitions(roles)) {
    return { error: "You do not have permission to create job requisitions." };
  }

  const erpCompanyName = String(formData.get("company") ?? "").trim();
  const designation = String(formData.get("designation") ?? "").trim();
  const noOfPositionsRaw = String(formData.get("noOfPositions") ?? "").trim();
  const expectedCompensation = String(formData.get("expectedCompensation") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const postingDate = String(formData.get("postingDate") ?? "").trim();
  const expectedBy = String(formData.get("expectedBy") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  const noOfPositions = Number(noOfPositionsRaw);
  if (
    !erpCompanyName ||
    !designation ||
    !expectedCompensation ||
    !postingDate ||
    !Number.isFinite(noOfPositions) ||
    noOfPositions < 1
  ) {
    return {
      error:
        "Company, designation, number of positions (at least 1), expected compensation, and posting date are required.",
    };
  }

  try {
    const requestedBy = await resolveJobRequisitionRequesterForCreate(session.email);
    const docName = await createERPNextJobRequisition({
      erpCompanyName,
      designation,
      noOfPositions,
      expectedCompensation,
      department: department || undefined,
      requestedBy,
      postingDate,
      expectedBy: expectedBy || undefined,
      description: description || undefined,
    });
    revalidatePath(`${STAFF_PORTAL_BASE}/job-requisitions`);
    revalidatePath(`${STAFF_PORTAL_BASE}/job-requisitions/new`);
    return { ok: `Job requisition ${docName} created.` };
  } catch (err) {
    const message = userFacingError(err, "Could not create job requisition.");
    return { error: message };
  }
}

async function requireExecutiveForJobRequisitionReview(): Promise<
  { error: string } | { session: NonNullable<Awaited<ReturnType<typeof getSession>>> }
> {
  const session = await getSession();
  if (!session) return { error: "Sign in required." };

  const roles = staffRolesFromSession(session);
  if (!staffHasExecutiveCapabilities(roles)) {
    return { error: "Only executives can approve or reject requisitions." };
  }

  return { session };
}

async function setJobRequisitionStatusForExecutive(
  docName: string,
  status: string,
  successMessage: string,
): Promise<{ ok?: string; error?: string }> {
  const auth = await requireExecutiveForJobRequisitionReview();
  if ("error" in auth) return { error: auth.error };

  const trimmed = docName.trim();
  if (!trimmed) return { error: "Invalid requisition." };

  try {
    await updateERPNextJobRequisitionStatus(trimmed, status);
    revalidatePath(`${STAFF_PORTAL_BASE}/job-requisitions`);
    revalidatePath(`${STAFF_PORTAL_BASE}/job-requisitions/${encodeURIComponent(trimmed)}`);
    return { ok: successMessage };
  } catch (err) {
    const message = userFacingError(err, "Could not update requisition status.");
    return { error: message };
  }
}

export async function approveJobRequisition(
  docName: string,
): Promise<{ ok?: string; error?: string }> {
  return setJobRequisitionStatusForExecutive(
    docName,
    JOB_REQUISITION_STATUS_OPEN_APPROVED,
    "Requisition approved.",
  );
}

export async function rejectJobRequisition(
  docName: string,
): Promise<{ ok?: string; error?: string }> {
  return setJobRequisitionStatusForExecutive(
    docName,
    JOB_REQUISITION_STATUS_REJECTED,
    "Requisition rejected.",
  );
}
