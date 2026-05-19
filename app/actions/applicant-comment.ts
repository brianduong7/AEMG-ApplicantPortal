"use server";

import { revalidatePath } from "next/cache";
import { createERPNextCommentForDocument } from "@/lib/erpnext";
import { loadApplicantForRecruiterPortal } from "@/lib/recruiter-applicants";
import { getSession, isStaffPortalSession } from "@/lib/session";
import { staffRolesFromSession } from "@/lib/staff-roles";

export type ApplicantCommentFormState = { error?: string; ok?: string } | null;

const STAFF_VIEW_ROLES = [
  "d_recruiter",
  "d_hr",
  "d_executive",
  "super_admin",
] as const;

async function requireStaffApplicantCommentAccess() {
  const session = await getSession();
  if (!session || !isStaffPortalSession(session)) {
    throw new Error("Unauthorized");
  }
  const roles = staffRolesFromSession(session);
  if (!STAFF_VIEW_ROLES.some((r) => roles.includes(r))) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function addJobApplicantComment(
  _prev: ApplicantCommentFormState,
  formData: FormData,
): Promise<ApplicantCommentFormState> {
  try {
    await requireStaffApplicantCommentAccess();

    const applicantDoc = String(formData.get("applicantDocName") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();

    if (!applicantDoc) return { error: "Missing applicant." };
    if (!content) return { error: "Enter a comment." };

    const applicant = await loadApplicantForRecruiterPortal(applicantDoc);
    if (!applicant?.name) return { error: "Applicant not found." };

    await createERPNextCommentForDocument("Job Applicant", applicant.name, content);

    revalidatePath(`/staff/applicants/${encodeURIComponent(applicant.name)}`);
    return { ok: "Comment added." };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not add comment.";
    return { error: message };
  }
}
