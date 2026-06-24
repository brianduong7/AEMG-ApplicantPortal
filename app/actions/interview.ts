"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createERPNextInterview,
  createERPNextInterviewRound,
  createERPNextInterviewType,
  rescheduleERPNextInterview,
  submitERPNextInterview,
  updateERPNextInterview,
} from "@/lib/erpnext";
import { normalizeErpTime } from "@/lib/erp-time";
import { loadApplicantForRecruiterPortal } from "@/lib/recruiter-applicants";
import { getSession, isStaffPortalSession } from "@/lib/session";
import {
  staffHasHrCapabilities,
  staffHasRecruiterCapabilities,
  staffRolesFromSession,
} from "@/lib/staff-roles";
import { requireRecruiterInAction, type RecruiterFormState } from "@/app/actions/recruiter";
import { saveDemoInterviewMeeting } from "@/lib/demo-interview-meeting";
import { userFacingError } from "@/lib/user-facing-copy";

const INTERVIEW_INTEGRATION_OPTS = { frappeSessionCookie: null as string | null };

async function requireInterviewWorkflowInAction() {
  const session = await getSession();
  if (!session) throw new Error("Sign in required.");
  if (isStaffPortalSession(session)) {
    const roles = staffRolesFromSession(session);
    if (!staffHasRecruiterCapabilities(roles) && !staffHasHrCapabilities(roles)) {
      throw new Error("You do not have permission to manage interviews.");
    }
    return session;
  }
  await requireRecruiterInAction();
  return session;
}

export type InterviewFormState = RecruiterFormState;

export async function createInterviewForStaff(
  _prev: InterviewFormState,
  formData: FormData,
): Promise<InterviewFormState> {
  try {
    await requireRecruiterInAction();
    const applicantName = String(formData.get("applicantName") ?? "").trim();
    if (!applicantName) return { error: "Application is required." };

    const visible = await loadApplicantForRecruiterPortal(applicantName);
    if (!visible) return { error: "Applicant not found." };

    const scheduledOn = String(formData.get("scheduledOn") ?? "").trim();
    const fromTime = String(formData.get("fromTime") ?? "").trim();
    const toTime = String(formData.get("toTime") ?? "").trim();
    const interviewRound = String(formData.get("interviewRound") ?? "").trim();
    const interviewType = String(formData.get("interviewType") ?? "").trim();

    if (!scheduledOn || !fromTime || !toTime) {
      return { error: "Date, start time, and end time are required." };
    }
    if (!interviewRound && !interviewType) {
      return { error: "Select an interview round or interview type." };
    }

    const interviewSummary = String(formData.get("interviewSummary") ?? "").trim();

    const id = await createERPNextInterview({
      jobApplicantName: applicantName,
      scheduledOn,
      fromTime: normalizeErpTime(fromTime),
      toTime: normalizeErpTime(toTime),
      interviewRound: interviewRound || undefined,
      interviewType: interviewType || undefined,
      interviewerUsers: [],
      interviewSummary: interviewSummary || undefined,
    });

    await saveDemoInterviewMeeting(id);

    revalidatePath("/staff/interviews");
    revalidatePath(`/staff/interviews/${encodeURIComponent(id)}`);
    redirect(`/staff/interviews/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err;
    const message = userFacingError(err, "Could not create interview.");
    return { error: message };
  }
}

export async function createInterviewRoundForStaff(
  _prev: InterviewFormState,
  formData: FormData,
): Promise<InterviewFormState> {
  try {
    await requireRecruiterInAction();
    const roundName = String(formData.get("roundName") ?? "").trim();
    if (!roundName) return { error: "Round name is required." };

    const name = await createERPNextInterviewRound({ roundName });
    revalidatePath("/staff/interviews");
    revalidatePath("/staff/interviews/new");
    return { ok: name };
  } catch (err) {
    const message = userFacingError(err, "Could not create interview round.");
    return { error: message };
  }
}

export async function createInterviewTypeForStaff(
  _prev: InterviewFormState,
  formData: FormData,
): Promise<InterviewFormState> {
  try {
    await requireRecruiterInAction();
    const name = String(formData.get("typeName") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    if (!name) return { error: "Interview type name is required." };

    const docName = await createERPNextInterviewType({
      name,
      description: description || undefined,
    });
    revalidatePath("/staff/interviews");
    revalidatePath("/staff/interviews/new");
    return { ok: docName };
  } catch (err) {
    const message = userFacingError(err, "Could not create interview type.");
    return { error: message };
  }
}

export async function updateInterviewSummaryForStaff(
  _prev: InterviewFormState,
  formData: FormData,
): Promise<InterviewFormState> {
  try {
    await requireRecruiterInAction();
    const docName = String(formData.get("docName") ?? "").trim();
    if (!docName) return { error: "Missing interview reference." };

    const interviewSummary = String(formData.get("interviewSummary") ?? "");
    await updateERPNextInterview(docName, { interviewSummary }, INTERVIEW_INTEGRATION_OPTS);
    revalidatePath(`/staff/interviews/${encodeURIComponent(docName)}`);
    revalidatePath("/staff/interviews");
    return { ok: "Interview summary saved." };
  } catch (err) {
    const message = userFacingError(err, "Could not save interview summary.");
    return { error: message };
  }
}

export async function rescheduleInterviewForStaff(
  _prev: InterviewFormState,
  formData: FormData,
): Promise<InterviewFormState> {
  try {
    await requireInterviewWorkflowInAction();
    const docName = String(formData.get("docName") ?? "").trim();
    if (!docName) return { error: "Missing interview reference." };

    const scheduledOn = String(formData.get("scheduledOn") ?? "").trim();
    const fromTime = String(formData.get("fromTime") ?? "").trim();
    const toTime = String(formData.get("toTime") ?? "").trim();
    if (!scheduledOn || !fromTime || !toTime) {
      return { error: "Date, start time, and end time are required." };
    }

    await rescheduleERPNextInterview(
      docName,
      {
        scheduledOn,
        fromTime: normalizeErpTime(fromTime),
        toTime: normalizeErpTime(toTime),
      },
      INTERVIEW_INTEGRATION_OPTS,
    );
    revalidatePath(`/staff/interviews/${encodeURIComponent(docName)}`);
    revalidatePath("/staff/interviews");
    return { ok: "Interview rescheduled." };
  } catch (err) {
    const message = userFacingError(err, "Could not reschedule interview.");
    return { error: message };
  }
}

export async function submitInterviewForStaff(
  _prev: InterviewFormState,
  formData: FormData,
): Promise<InterviewFormState> {
  try {
    await requireInterviewWorkflowInAction();
    const docName = String(formData.get("docName") ?? "").trim();
    if (!docName) return { error: "Missing interview reference." };

    const statusRaw = String(formData.get("status") ?? "").trim();
    if (statusRaw !== "Cleared" && statusRaw !== "Rejected") {
      return { error: "Select an outcome: Cleared or Rejected." };
    }

    const interviewSummary = String(formData.get("interviewSummary") ?? "").trim();

    await submitERPNextInterview(
      docName,
      {
        status: statusRaw,
        interviewSummary: interviewSummary || undefined,
      },
      INTERVIEW_INTEGRATION_OPTS,
    );
    revalidatePath(`/staff/interviews/${encodeURIComponent(docName)}`);
    revalidatePath("/staff/interviews");
    return { ok: `Interview submitted as ${statusRaw}.` };
  } catch (err) {
    const message = userFacingError(err, "Could not submit interview.");
    return { error: message };
  }
}
