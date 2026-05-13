import {
  erpnextGetLoggedUser,
  readApplicantFrappeCookieHeader,
} from "@/lib/applicant-erpnext-session";
import {
  fetchERPNextCandidateForUserName,
  type ERPNextCandidateRow,
} from "@/lib/erpnext";

/**
 * Returns the Candidate for the current Frappe website session (integration-backed fetch).
 */
export async function getApplicantCandidateStrict(): Promise<ERPNextCandidateRow | null> {
  const cookieHeader = await readApplicantFrappeCookieHeader();
  if (!cookieHeader) return null;
  const user = await erpnextGetLoggedUser(cookieHeader);
  if (!user) return null;
  return fetchERPNextCandidateForUserName(user);
}
