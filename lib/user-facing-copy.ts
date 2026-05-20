/** User-visible strings — avoid product names (ERPNext, Frappe, etc.). */

export const COPY_BACKEND_NOT_CONFIGURED =
  "Recruitment services are not configured. Contact your administrator.";

export const COPY_SIGN_IN_NOT_CONFIGURED =
  "Sign-in is not configured. Contact your administrator.";

export const COPY_INTERVIEW_SCHEDULED_OK = "Interview scheduled successfully.";

export const COPY_APPLICANT_NOT_FOUND = "Applicant not found.";

export const COPY_SUBMIT_APPLICATION_FAILED =
  "Could not submit your application right now. Please try again.";

/** Strip backend product names from messages shown in the UI. */
export function sanitizeUserFacingMessage(message: string): string {
  let s = message.trim();
  if (!s) return s;

  s = s.replace(/\bERPNext\b/gi, "the recruitment system");
  s = s.replace(/\bFrappe\b/gi, "the system");
  s = s.replace(/\bHRIS\b/g, "HR");
  s = s.replace(/\bthe the\b/gi, "the");
  s = s.replace(/\s{2,}/g, " ");

  return s.trim();
}

/** Error text for server actions (sanitizes backend product names). */
export function userFacingError(err: unknown, fallback: string): string {
  const raw =
    err instanceof Error && err.message.trim() ? err.message : fallback;
  return sanitizeUserFacingMessage(raw);
}
