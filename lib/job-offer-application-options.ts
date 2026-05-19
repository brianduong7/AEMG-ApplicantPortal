import {
  fetchERPNextJobApplicants,
  fetchERPNextJobOpeningsForHr,
  getERPNextJobApplicantOpeningField,
  type ERPNextJobApplicantRow,
} from "@/lib/erpnext";

export type JobOfferApplicationOption = {
  name: string;
  label: string;
  applicantName: string;
  email?: string;
  designation?: string;
  jobOpeningLabel?: string;
};

export async function buildJobOfferApplicationOptions(): Promise<JobOfferApplicationOption[]> {
  const [applicants, openings] = await Promise.all([
    fetchERPNextJobApplicants({ limit: 500 }),
    fetchERPNextJobOpeningsForHr(),
  ]);

  const openingField = getERPNextJobApplicantOpeningField();
  const openingLabelById = new Map<string, string>();
  for (const o of openings ?? []) {
    const id = o.name?.trim();
    if (!id) continue;
    openingLabelById.set(id, o.job_title?.trim() || id);
  }

  return (applicants ?? [])
    .map((a) => rowToOption(a, openingField, openingLabelById))
    .filter((a): a is JobOfferApplicationOption => a !== null)
    .sort((a, b) => a.label.localeCompare(b.label));
}

function rowToOption(
  a: ERPNextJobApplicantRow,
  openingField: string,
  openingLabelById: Map<string, string>,
): JobOfferApplicationOption | null {
  const name = a.name?.trim();
  if (!name) return null;
  const applicantName = a.applicant_name?.trim() || name;
  const email = a.email_id?.trim();
  const label = [applicantName, email].filter(Boolean).join(" · ") || name;
  const row = a as Record<string, unknown>;
  const openingId =
    typeof row[openingField] === "string" ? row[openingField].trim() : undefined;
  const jobOpeningLabel =
    openingId ? openingLabelById.get(openingId) ?? openingId : undefined;
  const designation = a.designation?.trim();

  return {
    name,
    label,
    applicantName,
    email: email || undefined,
    designation: designation || undefined,
    jobOpeningLabel,
  };
}
