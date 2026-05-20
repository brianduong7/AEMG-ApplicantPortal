"use server";

import { revalidatePath } from "next/cache";
import {
  createERPNextJobRequisition,
  JOB_REQUISITION_STATUS_OPEN_APPROVED,
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

  const designation = String(formData.get("designation") ?? "").trim();
  const noOfPositionsRaw = String(formData.get("noOfPositions") ?? "").trim();
  const expectedCompensation = String(formData.get("expectedCompensation") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const postingDate = String(formData.get("postingDate") ?? "").trim();
  const expectedBy = String(formData.get("expectedBy") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const namingSeries = String(formData.get("namingSeries") ?? "").trim();

  const noOfPositions = Number(noOfPositionsRaw);
  if (!designation || !expectedCompensation || !postingDate || !Number.isFinite(noOfPositions) || noOfPositions < 1) {
    return {
      error:
        "Designation, number of positions (at least 1), expected compensation, and posting date are required.",
    };
  }

  try {
    const docName = await createERPNextJobRequisition({
      company: session.company,
      designation,
      noOfPositions,
      expectedCompensation,
      department: department || undefined,
      requestedBy: session.email,
      postingDate,
      expectedBy: expectedBy || undefined,
      description: description || undefined,
      namingSeries: namingSeries || undefined,
    });
    revalidatePath(`${STAFF_PORTAL_BASE}/job-requisitions`);
    return { ok: `Job requisition ${docName} created.` };
  } catch (err) {
    const message = userFacingError(err, "Could not create job requisition.");
    return { error: message };
  }
}

export async function approveJobRequisition(
  docName: string,
): Promise<{ ok?: string; error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Sign in required." };

  const roles = staffRolesFromSession(session);
  if (!staffHasExecutiveCapabilities(roles)) {
    return { error: "Only executives can approve requisitions." };
  }

  const trimmed = docName.trim();
  if (!trimmed) return { error: "Invalid requisition." };

  try {
    await updateERPNextJobRequisitionStatus(trimmed, JOB_REQUISITION_STATUS_OPEN_APPROVED);
    revalidatePath(`${STAFF_PORTAL_BASE}/job-requisitions`);
    revalidatePath(`${STAFF_PORTAL_BASE}/job-requisitions/${encodeURIComponent(trimmed)}`);
    return { ok: "Requisition approved." };
  } catch (err) {
    const message = userFacingError(err, "Could not approve requisition.");
    return { error: message };
  }
}
