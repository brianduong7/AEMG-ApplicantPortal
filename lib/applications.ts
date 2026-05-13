import type { CompanyId } from "@/lib/companies";
import { getApplicantCandidateStrict } from "@/lib/applicant-candidate";
import {
  fetchERPNextJobApplicantsForCandidateDoc,
  getERPNextJobApplicantOpeningField,
  hasERPNextConfig,
  type ERPNextJobApplicantRow,
} from "@/lib/erpnext";
import { getJobById } from "@/lib/jobs";

export type ApplicantApplication = {
  id: string;
  jobTitle: string;
  appliedAt: string;
  status: string;
};

function formatAppliedAt(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

async function mapJobApplicantRowsToApplications(
  rows: ERPNextJobApplicantRow[],
): Promise<ApplicantApplication[]> {
  const openingField = getERPNextJobApplicantOpeningField();
  const out: ApplicantApplication[] = [];
  for (const row of rows) {
    const openingIdRaw = (row as Record<string, unknown>)[openingField];
    const openingId = typeof openingIdRaw === "string" ? openingIdRaw : row.job_title;
    const job = openingId ? await getJobById(openingId) : null;
    out.push({
      id: row.name ?? "",
      jobTitle: job?.title ?? openingId ?? "Job opening",
      appliedAt: formatAppliedAt(row.creation),
      status: row.status?.trim() || "Submitted",
    });
  }
  return out;
}

/**
 * Job Applicant documents in ERPNext linked to a Candidate (by `custom_candidate` or env field).
 */
export async function fetchJobApplicantsForCandidate(
  candidateDocName: string,
): Promise<ApplicantApplication[]> {
  const name = candidateDocName.trim();
  if (!hasERPNextConfig() || !name) return [];

  const rows = await fetchERPNextJobApplicantsForCandidateDoc(name);
  if (!rows?.length) return [];

  return mapJobApplicantRowsToApplications(rows);
}

/**
 * Lists Job Applicants for the current portal user’s Candidate (ERPNext), scoped server-side.
 */
export async function getApplicationsForCurrentApplicant(
  _company: CompanyId,
): Promise<ApplicantApplication[]> {
  void _company;
  if (!hasERPNextConfig()) return [];

  const candidate = await getApplicantCandidateStrict();
  if (!candidate?.name) return [];

  return fetchJobApplicantsForCandidate(candidate.name);
}
