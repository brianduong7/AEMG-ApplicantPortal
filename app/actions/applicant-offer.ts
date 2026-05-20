"use server";

import { revalidatePath } from "next/cache";
import {
  APPLICANT_ERP_STATUS_OFFER_ACCEPTED,
  APPLICANT_ERP_STATUS_OFFER_DECLINED,
  JOB_OFFER_ERP_STATUS_ACCEPTED,
  JOB_OFFER_ERP_STATUS_AWAITING,
  JOB_OFFER_ERP_STATUS_REJECTED,
} from "@/lib/applications";
import { getApplicantCandidateStrict } from "@/lib/applicant-candidate";
import {
  fetchERPNextJobApplicantByName,
  fetchERPNextJobOfferByName,
  getERPNextJobApplicantCandidateField,
  updateERPNextJobApplicantStatus,
  updateERPNextJobOffer,
} from "@/lib/erpnext";
import { getSession, isApplicantPortal } from "@/lib/session";
import { userFacingError } from "@/lib/user-facing-copy";

export type ApplicantOfferResponseState = { error?: string; ok?: string } | null;

async function requireApplicantInAction() {
  const session = await getSession();
  if (!session || !isApplicantPortal(session)) {
    throw new Error("Sign in to your applicant account.");
  }
  return session;
}

async function assertOfferBelongsToCandidate(
  offerDocName: string,
  candidateDocName: string,
): Promise<{ offerJobApplicantId: string }> {
  const offer = await fetchERPNextJobOfferByName(offerDocName, { frappeSessionCookie: null });
  if (!offer?.name) throw new Error("Job offer not found.");

  const jobApplicantId = offer.job_applicant?.trim();
  if (!jobApplicantId) throw new Error("This offer is not linked to an application.");

  const applicant = await fetchERPNextJobApplicantByName(jobApplicantId);
  if (!applicant?.name) throw new Error("Application not found.");

  const candidateField = getERPNextJobApplicantCandidateField();
  const linked = (applicant as Record<string, unknown>)[candidateField];
  if (typeof linked !== "string" || linked.trim() !== candidateDocName.trim()) {
    throw new Error("You do not have access to this job offer.");
  }

  if (offer.docstatus !== 1) {
    throw new Error("This job offer is not yet available for a response.");
  }
  if (offer.status !== JOB_OFFER_ERP_STATUS_AWAITING) {
    throw new Error("This job offer has already been responded to.");
  }

  return { offerJobApplicantId: jobApplicantId };
}

export async function respondToJobOffer(
  _prev: ApplicantOfferResponseState,
  formData: FormData,
): Promise<ApplicantOfferResponseState> {
  try {
    await requireApplicantInAction();
    const candidate = await getApplicantCandidateStrict();
    if (!candidate?.name) {
      return { error: "No candidate profile is linked to your account." };
    }

    const offerDocName = String(formData.get("offerDocName") ?? "").trim();
    const decision = String(formData.get("decision") ?? "").trim().toLowerCase();
    if (!offerDocName) return { error: "Missing job offer reference." };
    if (decision !== "accept" && decision !== "decline") {
      return { error: "Invalid response." };
    }

    const { offerJobApplicantId } = await assertOfferBelongsToCandidate(
      offerDocName,
      candidate.name,
    );

    const offerStatus =
      decision === "accept" ?
        JOB_OFFER_ERP_STATUS_ACCEPTED
      : JOB_OFFER_ERP_STATUS_REJECTED;
    const applicationStatus =
      decision === "accept" ?
        APPLICANT_ERP_STATUS_OFFER_ACCEPTED
      : APPLICANT_ERP_STATUS_OFFER_DECLINED;

    await updateERPNextJobOffer(offerDocName, { status: offerStatus }, { frappeSessionCookie: null });
    await updateERPNextJobApplicantStatus(offerJobApplicantId, applicationStatus);

    revalidatePath("/applicant/applications");
    revalidatePath(`/applicant/applications/${encodeURIComponent(offerJobApplicantId)}`);
    revalidatePath("/applicant/my-offers");
    revalidatePath(`/applicant/my-offers/${encodeURIComponent(offerDocName)}`);
    revalidatePath("/applicant/job-offers");

    return {
      ok:
        decision === "accept" ?
          "You accepted the job offer. Your application status has been updated."
        : "You declined the job offer. Your application status has been updated.",
    };
  } catch (err) {
    const message = userFacingError(err, "Could not update job offer.");
    return { error: message };
  }
}
