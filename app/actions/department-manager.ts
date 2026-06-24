"use server";

import { revalidatePath } from "next/cache";
import {
  createERPNextInterview,
  hasERPNextConfig,
} from "@/lib/erpnext";
import { saveDemoInterviewMeeting } from "@/lib/demo-interview-meeting";
import { normalizeErpTime } from "@/lib/erp-time";
import { loadApplicantForDepartmentManagerPortal } from "@/lib/department-manager-applicants";
import { getSession, isDepartmentManagerPortal } from "@/lib/session";
import type { RecruiterFormState } from "@/app/actions/recruiter";
import { userFacingError } from "@/lib/user-facing-copy";

async function requireDepartmentManagerInAction() {
  const session = await getSession();
  if (!session || !isDepartmentManagerPortal(session)) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function scheduleInterviewForDepartmentManager(
  _prev: RecruiterFormState,
  formData: FormData,
): Promise<RecruiterFormState> {
  try {
    await requireDepartmentManagerInAction();
    const applicantName = String(formData.get("applicantName") ?? "").trim();
    if (!applicantName) return { error: "Missing applicant." };

    if (!hasERPNextConfig()) {
      return { error: "Recruitment services are not configured. Contact your administrator." };
    }

    const session = await getSession();
    if (!session?.email) return { error: "Missing session." };

    const visible = await loadApplicantForDepartmentManagerPortal(applicantName, session.email);
    if (!visible) return { error: "Applicant not found or not linked to your job openings." };

    const scheduledOn = String(formData.get("scheduledOn") ?? "").trim();
    const fromTime = String(formData.get("fromTime") ?? "").trim();
    const toTime = String(formData.get("toTime") ?? "").trim();
    const interviewRound = String(formData.get("interviewRound") ?? "").trim();
    const interviewType = String(formData.get("interviewType") ?? "").trim();
    const interviewerUsersJson = String(formData.get("interviewerUsersJson") ?? "").trim();

    let interviewerUsers: string[] | undefined;
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

    const interviewId = await createERPNextInterview({
      jobApplicantName: applicantName,
      scheduledOn,
      fromTime: normalizeErpTime(fromTime),
      toTime: normalizeErpTime(toTime),
      interviewRound: interviewRound || undefined,
      interviewType: interviewType || undefined,
      interviewerUsers,
    });
    await saveDemoInterviewMeeting(interviewId);
    revalidatePath(`/staff/applicants/${encodeURIComponent(applicantName)}`);
    revalidatePath("/staff/interviews");
    return { ok: "Interview scheduled successfully." };
  } catch (err) {
    const message = userFacingError(err, "Could not schedule interview.");
    return { error: message };
  }
}
