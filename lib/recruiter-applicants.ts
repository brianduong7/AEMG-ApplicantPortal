import { fetchERPNextJobApplicantByName, type ERPNextJobApplicantRow } from "@/lib/erpnext";

export async function loadApplicantForRecruiterPortal(
  applicantId: string,
): Promise<ERPNextJobApplicantRow | null> {
  return fetchERPNextJobApplicantByName(applicantId);
}
