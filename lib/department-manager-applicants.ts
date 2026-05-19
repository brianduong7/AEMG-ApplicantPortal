import {
  fetchERPNextJobApplicantByName,
  fetchERPNextJobOpeningsForDepartmentManager,
  getERPNextJobApplicantOpeningField,
  type ERPNextJobApplicantRow,
} from "@/lib/erpnext";

export async function loadApplicantForDepartmentManagerPortal(
  applicantId: string,
  managerUserId: string,
): Promise<ERPNextJobApplicantRow | null> {
  const applicant = await fetchERPNextJobApplicantByName(applicantId);
  if (!applicant?.name) return null;
  const openings = await fetchERPNextJobOpeningsForDepartmentManager(managerUserId);
  const ids = new Set(
    (openings ?? [])
      .map((o) => o.name)
      .filter((n): n is string => typeof n === "string" && n.length > 0),
  );
  const linkField = getERPNextJobApplicantOpeningField();
  const openingId = (applicant as Record<string, string | undefined>)[linkField];
  if (openingId && ids.has(openingId)) return applicant;
  return null;
}
