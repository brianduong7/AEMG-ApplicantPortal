"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createERPNextDesignation,
  createERPNextInterview,
  createERPNextJobOpening,
  updateERPNextJobOpening,
} from "@/lib/erpnext";
import { loadApplicantForRecruiterPortal } from "@/lib/recruiter-applicants";
import { parseCompanyId } from "@/lib/companies";
import { normalizeErpTime } from "@/lib/erp-time";
import { getSession, isRecruiterPortal, isStaffPortalSession } from "@/lib/session";
import {
  staffCanCreateJobRequisitions,
  staffHasRecruiterCapabilities,
  staffRolesFromSession,
} from "@/lib/staff-roles";
import { userFacingError } from "@/lib/user-facing-copy";

export type RecruiterFormState = { error?: string; ok?: string } | null;

export async function requireRecruiterInAction() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (isStaffPortalSession(session)) {
    const roles = staffRolesFromSession(session);
    if (!staffHasRecruiterCapabilities(roles)) throw new Error("Unauthorized");
    return session;
  }
  if (!isRecruiterPortal(session)) {
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
    const jobRequisition = String(formData.get("jobRequisition") ?? "").trim();

    if (!jobTitle || !designation) {
      return { error: "Job title and designation are required." };
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
      jobRequisition: jobRequisition || undefined,
    });
    revalidatePath("/staff/openings");
  } catch (err) {
    const message = userFacingError(err, "Could not create opening.");
    return { error: message };
  }
  redirect("/staff/openings");
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
    const jobRequisition = String(formData.get("jobRequisition") ?? "").trim();

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
      jobRequisition: jobRequisition || null,
    });
    revalidatePath("/staff/openings");
    revalidatePath(`/staff/openings/${encodeURIComponent(docName)}/edit`);
  } catch (err) {
    const message = userFacingError(err, "Could not update opening.");
    return { error: message };
  }
  redirect("/staff/openings");
}

async function requireDesignationCreateInAction() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (isStaffPortalSession(session)) {
    const roles = staffRolesFromSession(session);
    if (
      !staffHasRecruiterCapabilities(roles) &&
      !staffCanCreateJobRequisitions(roles)
    ) {
      throw new Error("Unauthorized");
    }
    return session;
  }
  if (!isRecruiterPortal(session)) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createDesignationForRecruiter(
  _prev: RecruiterFormState,
  formData: FormData,
): Promise<RecruiterFormState> {
  try {
    await requireDesignationCreateInAction();
    const designation = String(formData.get("designationTitle") ?? "").trim();
    const description = String(formData.get("designationDescription") ?? "").trim();
    if (!designation) return { error: "Designation title is required." };

    /** Master data writes use the integration API user; desk users often lack Designation create. */
    const name = await createERPNextDesignation(
      {
        designation,
        description: description || undefined,
      },
      { frappeSessionCookie: null },
    );
    revalidatePath("/staff/openings/new");
    revalidatePath("/staff/openings");
    revalidatePath("/staff/job-requisitions/new");
    return { ok: name };
  } catch (err) {
    const message = userFacingError(err, "Could not create designation.");
    return { error: message };
  }
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
    if (!visible) return { error: "Applicant not found." };

    const scheduledOn = String(formData.get("scheduledOn") ?? "").trim();
    const fromTime = String(formData.get("fromTime") ?? "").trim();
    const toTime = String(formData.get("toTime") ?? "").trim();
    const interviewRound = String(formData.get("interviewRound") ?? "").trim();
    const interviewType = String(formData.get("interviewType") ?? "").trim();
    const interviewerUsersJson = String(formData.get("interviewerUsersJson") ?? "").trim();
    const interviewerUser = String(formData.get("interviewerUser") ?? "").trim();

    let interviewerUsers: string[] | undefined;
    if (interviewerUser) {
      interviewerUsers = [interviewerUser];
    }
    if (interviewerUsersJson) {
      try {
        const parsed = JSON.parse(interviewerUsersJson) as unknown;
        if (!Array.isArray(parsed)) {
          return { error: "Interviewers must be a JSON array of user ids." };
        }
        const ids = parsed
          .filter((x): x is string => typeof x === "string")
          .map((s) => s.trim())
          .filter(Boolean);
        if (ids.length) interviewerUsers = ids;
      } catch {
        return { error: "Could not read selected interviewers. Try again." };
      }
    }

    if (!scheduledOn || !fromTime || !toTime) {
      return { error: "Date, start time, and end time are required." };
    }

    if (!interviewRound && !interviewType) {
      return {
        error:
          "Select an interview round (HRMS v15) or an interview type (newer HRMS), or set a default in environment.",
      };
    }

    await createERPNextInterview({
      jobApplicantName: applicantName,
      scheduledOn,
      fromTime: normalizeErpTime(fromTime),
      toTime: normalizeErpTime(toTime),
      interviewRound: interviewRound || undefined,
      interviewType: interviewType || undefined,
      interviewerUsers,
    });
    revalidatePath(`/staff/applicants/${encodeURIComponent(applicantName)}`);
    revalidatePath("/staff/interviews");
    return { ok: "Interview scheduled successfully." };
  } catch (err) {
    const message = userFacingError(err, "Could not schedule interview.");
    return { error: message };
  }
}

