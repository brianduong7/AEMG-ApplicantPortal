"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createERPNextInterview,
  createERPNextJobOpening,
  updateERPNextJobOpening,
} from "@/lib/erpnext";
import { loadApplicantForRecruiterPortal } from "@/lib/recruiter-applicants";
import { getSession, isRecruiterPortal } from "@/lib/session";

export type RecruiterFormState = { error?: string; ok?: string } | null;

async function requireRecruiterInAction() {
  const session = await getSession();
  if (!session || !isRecruiterPortal(session)) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createOpeningForRecruiter(
  _prev: RecruiterFormState,
  formData: FormData,
): Promise<RecruiterFormState> {
  try {
    const session = await requireRecruiterInAction();
    const jobTitle = String(formData.get("jobTitle") ?? "").trim();
    const designation = String(formData.get("designation") ?? "").trim();
    const department = String(formData.get("department") ?? "").trim();
    const employmentType = String(formData.get("employmentType") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const statusRaw = String(formData.get("status") ?? "Open").trim();
    const status = statusRaw === "Closed" ? "Closed" : "Open";
    const publish = formData.get("publish") === "on" ? 1 : 0;

    if (!jobTitle || !designation) {
      return { error: "Job title and designation are required (designation must exist in ERPNext)." };
    }

    await createERPNextJobOpening({
      company: session.company,
      jobTitle,
      designation,
      department: department || undefined,
      employmentType: employmentType || undefined,
      location: location || undefined,
      description: description || undefined,
      status,
      publish,
    });
    revalidatePath("/recruiter/openings");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create opening.";
    return { error: message };
  }
  redirect("/recruiter/openings");
}

export async function updateOpeningForRecruiter(
  _prev: RecruiterFormState,
  formData: FormData,
): Promise<RecruiterFormState> {
  try {
    await requireRecruiterInAction();
    const docName = String(formData.get("docName") ?? "").trim();
    if (!docName) return { error: "Missing job opening reference." };

    const jobTitle = String(formData.get("jobTitle") ?? "").trim();
    const designation = String(formData.get("designation") ?? "").trim();
    const department = String(formData.get("department") ?? "").trim();
    const employmentType = String(formData.get("employmentType") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const statusRaw = String(formData.get("status") ?? "Open").trim();
    const status = statusRaw === "Closed" ? "Closed" : "Open";
    const publish = formData.get("publish") === "on" ? 1 : 0;

    if (!jobTitle || !designation) {
      return { error: "Job title and designation are required." };
    }

    await updateERPNextJobOpening(docName, {
      jobTitle,
      designation,
      department,
      employmentType,
      location,
      description,
      status,
      publish,
    });
    revalidatePath("/recruiter/openings");
    revalidatePath(`/recruiter/openings/${encodeURIComponent(docName)}/edit`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update opening.";
    return { error: message };
  }
  redirect("/recruiter/openings");
}

export async function scheduleInterviewForRecruiter(
  _prev: RecruiterFormState,
  formData: FormData,
): Promise<RecruiterFormState> {
  try {
    await requireRecruiterInAction();
    const applicantName = String(formData.get("applicantName") ?? "").trim();
    if (!applicantName) return { error: "Missing applicant." };

    const visible = await loadApplicantForRecruiterPortal(applicantName);
    if (!visible) return { error: "Applicant not found in ERPNext." };

    const scheduledOn = String(formData.get("scheduledOn") ?? "").trim();
    const fromTime = String(formData.get("fromTime") ?? "").trim();
    const toTime = String(formData.get("toTime") ?? "").trim();
    const interviewType = String(formData.get("interviewType") ?? "").trim();
    const interviewerUser = String(formData.get("interviewerUser") ?? "").trim();

    if (!scheduledOn || !fromTime || !toTime) {
      return { error: "Date, start time, and end time are required." };
    }

    const fromNorm = fromTime.length === 5 ? `${fromTime}:00` : fromTime;
    const toNorm = toTime.length === 5 ? `${toTime}:00` : toTime;

    await createERPNextInterview({
      jobApplicantName: applicantName,
      scheduledOn,
      fromTime: fromNorm,
      toTime: toNorm,
      interviewType: interviewType || undefined,
      interviewerUser: interviewerUser || undefined,
    });
    revalidatePath(`/recruiter/applicants/${encodeURIComponent(applicantName)}`);
    return { ok: "Interview scheduled in ERPNext." };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not schedule interview.";
    return { error: message };
  }
}
