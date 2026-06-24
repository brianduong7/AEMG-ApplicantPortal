"use server";

import { revalidatePath } from "next/cache";
import {
  createERPNextCommentForDocument,
  fetchERPNextJobOfferByName,
} from "@/lib/erpnext";
import { readStaffFrappeCookieHeader } from "@/lib/staff-erpnext-session";
import { getSession, isStaffPortalSession } from "@/lib/session";
import { staffRolesFromSession } from "@/lib/staff-roles";
import { userFacingError } from "@/lib/user-facing-copy";

export type JobOfferCommentFormState = { error?: string; ok?: string } | null;

const STAFF_COMMENT_ROLES = [
  "d_recruiter",
  "d_hr",
  "d_executive",
  "super_admin",
] as const;

async function requireStaffJobOfferCommentAccess() {
  const session = await getSession();
  if (!session || !isStaffPortalSession(session)) {
    throw new Error("Unauthorized");
  }
  const roles = staffRolesFromSession(session);
  if (!STAFF_COMMENT_ROLES.some((r) => roles.includes(r))) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function addJobOfferComment(
  _prev: JobOfferCommentFormState,
  formData: FormData,
): Promise<JobOfferCommentFormState> {
  try {
    await requireStaffJobOfferCommentAccess();

    const offerDoc = String(formData.get("offerDocName") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();

    if (!offerDoc) return { error: "Missing job offer." };
    if (!content) return { error: "Enter a comment." };

    const frappeCookie = await readStaffFrappeCookieHeader();
    const offer = await fetchERPNextJobOfferByName(offerDoc, {
      frappeSessionCookie: frappeCookie,
    });
    if (!offer?.name) return { error: "Job offer not found." };

    await createERPNextCommentForDocument("Job Offer", offer.name, content);

    revalidatePath(`/staff/job-offers/${encodeURIComponent(offer.name)}`);
    return { ok: "Comment added." };
  } catch (err) {
    const message = userFacingError(err, "Could not add comment.");
    return { error: message };
  }
}
