"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseCompanyId } from "@/lib/companies";
import {
  createERPNextJobOffer,
  fetchERPNextJobOfferByName,
  sendERPNextJobOfferToCandidate,
  submitERPNextJobOffer,
  updateERPNextJobOffer,
} from "@/lib/erpnext";
import { parseJobOfferTermsJson } from "@/lib/job-offer-terms";
import { loadApplicantForRecruiterPortal } from "@/lib/recruiter-applicants";
import {
  staffCanApproveJobOffersForSession,
  staffHasHrCapabilities,
  staffHasRecruiterCapabilities,
  staffRolesFromSession,
} from "@/lib/staff-roles";
import { getSession } from "@/lib/session";

export type JobOfferHrFormState = { error?: string; ok?: string } | null;
export type JobOfferCreateFormState = { error?: string; ok?: string } | null;

const JOB_OFFER_STATUSES = new Set([
  "Awaiting Response",
  "Accepted",
  "Rejected",
  "Cancelled",
]);

async function requireJobOfferCreatorInAction() {
  const session = await getSession();
  if (!session) throw new Error("Sign in required.");
  const roles = staffRolesFromSession(session);
  if (!staffHasRecruiterCapabilities(roles) && !staffHasHrCapabilities(roles)) {
    throw new Error("You do not have permission to create job offers.");
  }
  return { session, roles };
}

export async function createJobOfferForStaff(
  _prev: JobOfferCreateFormState,
  formData: FormData,
): Promise<JobOfferCreateFormState> {
  try {
    const { session } = await requireJobOfferCreatorInAction();
    const applicantDoc = String(formData.get("applicantDocName") ?? "").trim();
    if (!applicantDoc) return { error: "Select an application." };

    const company = parseCompanyId(String(formData.get("company") ?? "").trim());
    if (!company || company !== session.company) {
      return { error: "Invalid company context." };
    }

    const visible = await loadApplicantForRecruiterPortal(applicantDoc);
    if (!visible) return { error: "Application not found." };

    const designation = String(formData.get("designation") ?? "").trim();
    const offerDate = String(formData.get("offerDate") ?? "").trim();
    const statusRaw = String(formData.get("status") ?? "Awaiting Response").trim();
    const status = JOB_OFFER_STATUSES.has(statusRaw) ? statusRaw : "Awaiting Response";
    const terms = String(formData.get("terms") ?? "").trim();
    const selectTerms = String(formData.get("selectTerms") ?? "").trim();
    const jobOfferTermTemplate = String(formData.get("jobOfferTermTemplate") ?? "").trim();
    const offerTerms = parseJobOfferTermsJson(String(formData.get("offerTermsJson") ?? ""));

    if (!designation || !offerDate) {
      return { error: "Designation and offer date are required." };
    }

    const applicantName = String(formData.get("applicantName") ?? "").trim()
      || visible.applicant_name?.trim()
      || applicantDoc;
    const applicantEmail =
      String(formData.get("applicantEmail") ?? "").trim() || visible.email_id?.trim();

    const docName = await createERPNextJobOffer({
      company: session.company,
      jobApplicantName: applicantDoc,
      applicantName,
      applicantEmail: applicantEmail || undefined,
      designation,
      offerDate,
      status,
      terms: terms || undefined,
      selectTerms: selectTerms || undefined,
      jobOfferTermTemplate: jobOfferTermTemplate || undefined,
      offerTerms: offerTerms.length ? offerTerms : undefined,
      saveAsDraft: true,
    });

    revalidatePath(`/staff/applicants/${encodeURIComponent(applicantDoc)}`);
    revalidatePath("/staff/job-offers");
    revalidatePath("/staff/job-offers/new");
    revalidatePath(`/staff/job-offers/${encodeURIComponent(docName)}`);
    redirect(`/staff/job-offers/${encodeURIComponent(docName)}`);
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err;
    const message = err instanceof Error ? err.message : "Could not create job offer.";
    return { error: message };
  }
}

async function requireHrForJobOfferWorkflowInAction() {
  const session = await getSession();
  if (!session) throw new Error("Sign in required.");
  if (!(await staffCanApproveJobOffersForSession(session))) {
    throw new Error("Only HR can review, submit, or send job offers.");
  }
  return session;
}

/** Job offer writes use the integration API user, not the signed-in recruiter’s Frappe session. */
const JOB_OFFER_INTEGRATION_OPTS = { frappeSessionCookie: null as string | null };

function revalidateJobOfferPaths(docName: string) {
  revalidatePath("/staff/job-offers");
  revalidatePath(`/staff/job-offers/${encodeURIComponent(docName)}`);
}

export async function jobOfferHrAction(
  _prev: JobOfferHrFormState,
  formData: FormData,
): Promise<JobOfferHrFormState> {
  try {
    await requireHrForJobOfferWorkflowInAction();
    const docName = String(formData.get("docName") ?? "").trim();
    if (!docName) return { error: "Missing job offer reference." };

    const intent = String(formData.get("intent") ?? "save").trim();
    const opts = JOB_OFFER_INTEGRATION_OPTS;

    if (intent === "submit") {
      await submitERPNextJobOffer(docName, opts);
      revalidateJobOfferPaths(docName);
      return { ok: "Job offer submitted and approved." };
    }

    if (intent === "send") {
      await sendERPNextJobOfferToCandidate(docName, opts);
      revalidateJobOfferPaths(docName);
      return { ok: "Job offer sent to the candidate by email." };
    }

    const designation = String(formData.get("designation") ?? "").trim();
    const offerDate = String(formData.get("offerDate") ?? "").trim();
    const terms = String(formData.get("terms") ?? "");
    const selectTerms = String(formData.get("selectTerms") ?? "").trim();
    const jobOfferTermTemplate = String(formData.get("jobOfferTermTemplate") ?? "").trim();
    const offerTerms = parseJobOfferTermsJson(String(formData.get("offerTermsJson") ?? ""));

    if (!designation || !offerDate) {
      return { error: "Designation and offer date are required." };
    }

    const current = await fetchERPNextJobOfferByName(docName, opts);
    if (!current?.name) return { error: "Job offer not found." };
    if (current.docstatus === 1) {
      return { error: "Submitted offers cannot be edited here. Cancel in the HR desk if needed." };
    }
    if (current.docstatus === 2) {
      return { error: "This job offer was cancelled." };
    }

    await updateERPNextJobOffer(
      docName,
      {
        designation,
        offerDate,
        terms,
        selectTerms,
        jobOfferTermTemplate,
        offerTerms,
      },
      opts,
    );
    revalidateJobOfferPaths(docName);
    return { ok: "Changes saved." };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update job offer.";
    return { error: message };
  }
}
