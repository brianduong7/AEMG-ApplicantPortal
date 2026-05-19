import type { CompanyId } from "@/lib/companies";
import { getApplicantCandidateStrict } from "@/lib/applicant-candidate";
import {
  fetchERPNextJobApplicantByName,
  fetchERPNextJobApplicantsForCandidateDoc,
  fetchERPNextJobOffersForJobApplicants,
  getERPNextJobApplicantCandidateField,
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

export type ApplicantApplicationDetail = ApplicantApplication & {
  applicantName: string;
  email: string;
  phone: string;
  openingId: string;
  jobLocation?: string;
  jobDepartment?: string;
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

export type ApplicantJobOffer = {
  id: string;
  jobApplicantId: string;
  applicationJobTitle: string;
  designation: string;
  offerDate: string;
  status: string;
  company: string;
};

function formatOfferDate(raw?: string): string {
  if (!raw?.trim()) return "—";
  const d = new Date(raw.trim());
  if (Number.isNaN(d.getTime())) return raw.trim().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

/**
 * Job offers in ERPNext for Job Applicants linked to this candidate (via applications).
 */
export async function fetchJobOffersForCandidate(
  candidateDocName: string,
): Promise<ApplicantJobOffer[]> {
  const name = candidateDocName.trim();
  if (!hasERPNextConfig() || !name) return [];

  const applicantRows = await fetchERPNextJobApplicantsForCandidateDoc(name);
  if (!applicantRows?.length) return [];

  const applicantIds = applicantRows
    .map((r) => r.name)
    .filter((n): n is string => typeof n === "string" && n.length > 0);
  if (applicantIds.length === 0) return [];

  const offers = (await fetchERPNextJobOffersForJobApplicants(applicantIds)) ?? [];
  const openingField = getERPNextJobApplicantOpeningField();
  const applicantById = new Map<string, ERPNextJobApplicantRow>();
  for (const row of applicantRows) {
    const id = row.name?.trim();
    if (id) applicantById.set(id, row);
  }

  const out: ApplicantJobOffer[] = [];
  for (const offer of offers) {
    const ja = offer.job_applicant?.trim() ?? "";
    const appRow = ja ? applicantById.get(ja) : undefined;
    const openingIdRaw = appRow ? (appRow as Record<string, unknown>)[openingField] : undefined;
    const openingId = typeof openingIdRaw === "string" ? openingIdRaw : undefined;
    const job = openingId ? await getJobById(openingId) : null;
    out.push({
      id: offer.name ?? "",
      jobApplicantId: ja,
      applicationJobTitle: job?.title ?? openingId ?? "Application",
      designation: offer.designation?.trim() || "—",
      offerDate: formatOfferDate(offer.offer_date),
      status: offer.status?.trim() || "—",
      company: offer.company?.trim() || "—",
    });
  }
  return out;
}

export async function getJobOffersForCurrentApplicant(
  _company: CompanyId,
): Promise<ApplicantJobOffer[]> {
  void _company;
  if (!hasERPNextConfig()) return [];

  const candidate = await getApplicantCandidateStrict();
  if (!candidate?.name) return [];

  return fetchJobOffersForCandidate(candidate.name);
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

async function mapJobApplicantRowToDetail(
  row: ERPNextJobApplicantRow,
): Promise<ApplicantApplicationDetail | null> {
  const id = row.name?.trim();
  if (!id) return null;

  const openingField = getERPNextJobApplicantOpeningField();
  const openingIdRaw = (row as Record<string, unknown>)[openingField];
  const openingId = typeof openingIdRaw === "string" ? openingIdRaw : row.job_title ?? "";
  const job = openingId ? await getJobById(openingId) : null;

  return {
    id,
    jobTitle: job?.title ?? (openingId || "Job opening"),
    appliedAt: formatAppliedAt(row.creation),
    status: row.status?.trim() || "Submitted",
    applicantName: row.applicant_name?.trim() || "—",
    email: row.email_id?.trim() || "—",
    phone: row.phone_number?.trim() || "—",
    openingId: openingId || "—",
    jobLocation: job?.location,
    jobDepartment: job?.department,
  };
}

/** Load one Job Applicant if it belongs to the given Candidate document. */
export async function fetchApplicantApplicationForCandidate(
  applicationDocName: string,
  candidateDocName: string,
): Promise<ApplicantApplicationDetail | null> {
  const appId = applicationDocName.trim();
  const candidateId = candidateDocName.trim();
  if (!hasERPNextConfig() || !appId || !candidateId) return null;

  const row = await fetchERPNextJobApplicantByName(appId);
  if (!row?.name) return null;

  const candidateField = getERPNextJobApplicantCandidateField();
  const linked = (row as Record<string, unknown>)[candidateField];
  if (typeof linked !== "string" || linked.trim() !== candidateId) return null;

  return mapJobApplicantRowToDetail(row);
}

export async function getApplicantApplicationDetail(
  applicationDocName: string,
): Promise<ApplicantApplicationDetail | null> {
  const candidate = await getApplicantCandidateStrict();
  if (!candidate?.name) return null;
  return fetchApplicantApplicationForCandidate(applicationDocName, candidate.name);
}

/** Typical HRMS Job Applicant statuses for a simple progress tracker. */
export const APPLICANT_STATUS_PIPELINE = [
  "Open",
  "Replied",
  "Hold",
  "Accepted",
  "Rejected",
] as const;

export function applicantStatusProgress(status: string): {
  steps: readonly string[];
  activeIndex: number;
} {
  const normalized = status.trim() || "Open";
  const steps = APPLICANT_STATUS_PIPELINE;
  let activeIndex = steps.findIndex((s) => s.toLowerCase() === normalized.toLowerCase());
  if (activeIndex < 0) {
    if (/reject/i.test(normalized)) activeIndex = steps.indexOf("Rejected");
    else if (/accept|offer|hired/i.test(normalized)) activeIndex = steps.indexOf("Accepted");
    else if (/hold|pause/i.test(normalized)) activeIndex = steps.indexOf("Hold");
    else if (/reply|interview/i.test(normalized)) activeIndex = steps.indexOf("Replied");
    else activeIndex = 0;
  }
  return { steps, activeIndex };
}
