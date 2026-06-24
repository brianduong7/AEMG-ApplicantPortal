import type { CompanyId } from "@/lib/companies";
import { getApplicantCandidateStrict } from "@/lib/applicant-candidate";
import {
  fetchERPNextInterviewsForJobApplicant,
  fetchERPNextJobApplicantByName,
  fetchERPNextJobApplicantsForCandidateDoc,
  fetchERPNextJobOfferByName,
  fetchERPNextJobOffersForJobApplicants,
  getERPNextJobApplicantCandidateField,
  getERPNextJobApplicantOpeningField,
  hasERPNextConfig,
  type ERPNextInterviewRow,
  type ERPNextJobApplicantRow,
  type ERPNextJobOfferRow,
} from "@/lib/erpnext";
import { getJobById } from "@/lib/jobs";

export type ApplicantApplication = {
  id: string;
  jobTitle: string;
  appliedAt: string;
  status: string;
  /** Status shown in the portal (interviews, offers, etc.). */
  displayStatus: string;
};

/** Portal pipeline labels shown to applicants. */
export const APPLICANT_PIPELINE_APPLIED = "Applied";
export const APPLICANT_PIPELINE_INTERVIEWING = "Interviewing";
export const APPLICANT_PIPELINE_OFFER_SENT = "Offer Created";
export const APPLICANT_PIPELINE_OFFER_ACCEPTED = "Offer Accepted";
export const APPLICANT_PIPELINE_OFFER_DECLINED = "Offer Declined";
export const APPLICANT_PIPELINE_REJECTED = "Rejected";

/** Job Offer status values in the recruitment system (only these three are valid). */
export const JOB_OFFER_ERP_STATUS_AWAITING = "Awaiting Response";
export const JOB_OFFER_ERP_STATUS_ACCEPTED = "Accepted";
export const JOB_OFFER_ERP_STATUS_REJECTED = "Rejected";

/** Job Applicant status after offer response (desk uses Accepted / Rejected). */
export const APPLICANT_ERP_STATUS_OFFER_ACCEPTED = JOB_OFFER_ERP_STATUS_ACCEPTED;
export const APPLICANT_ERP_STATUS_OFFER_DECLINED = JOB_OFFER_ERP_STATUS_REJECTED;

/** Portal label for a job offer's ERP status. */
export function jobOfferStatusDisplayLabel(erpStatus: string | null | undefined): string {
  const s = (erpStatus ?? "").trim();
  if (s === JOB_OFFER_ERP_STATUS_ACCEPTED) return APPLICANT_PIPELINE_OFFER_ACCEPTED;
  if (s === JOB_OFFER_ERP_STATUS_REJECTED) return APPLICANT_PIPELINE_OFFER_DECLINED;
  return s || "—";
}

export type ApplicantInterviewSummary = {
  id: string;
  scheduledOn: string;
  fromTime?: string;
  toTime?: string;
  status: string;
  roundOrType?: string;
};

export type ApplicantOfferForApplication = {
  id: string;
  status: string;
  designation: string;
  offerDate: string;
  company: string;
  docstatus: number;
  canRespond: boolean;
};

export type ApplicantApplicationDetail = ApplicantApplication & {
  applicantName: string;
  email: string;
  phone: string;
  openingId: string;
  jobLocation?: string;
  jobDepartment?: string;
  resumeAttachment?: string;
  interviews: ApplicantInterviewSummary[];
  offer: ApplicantOfferForApplication | null;
};

function pickOfferForApplicant(
  offers: ERPNextJobOfferRow[],
  jobApplicantId: string,
): ERPNextJobOfferRow | undefined {
  const matches = offers.filter((o) => o.job_applicant?.trim() === jobApplicantId);
  if (matches.length === 0) return undefined;
  const rank = (o: ERPNextJobOfferRow) => {
    if (o.status === JOB_OFFER_ERP_STATUS_ACCEPTED) return 0;
    if (o.status === JOB_OFFER_ERP_STATUS_AWAITING) return 1;
    if (o.status === JOB_OFFER_ERP_STATUS_REJECTED) return 2;
    return 3;
  };
  return [...matches].sort((a, b) => rank(a) - rank(b))[0];
}

export function hasScheduledInterview(interviews: ERPNextInterviewRow[]): boolean {
  return interviews.some((row) => {
    if (!row.scheduled_on?.trim()) return false;
    const st = (row.status ?? "").toLowerCase();
    if (st.includes("cancel")) return false;
    return true;
  });
}

export function resolveApplicantDisplayStatus(
  baseStatus: string,
  interviews: ERPNextInterviewRow[],
  offer?: ERPNextJobOfferRow,
): string {
  if (offer?.status === JOB_OFFER_ERP_STATUS_ACCEPTED) {
    return APPLICANT_PIPELINE_OFFER_ACCEPTED;
  }
  if (offer?.status === JOB_OFFER_ERP_STATUS_REJECTED) {
    return APPLICANT_PIPELINE_OFFER_DECLINED;
  }
  if (offer?.docstatus === 1 && offer.status === JOB_OFFER_ERP_STATUS_AWAITING) {
    return APPLICANT_PIPELINE_OFFER_SENT;
  }

  const normalized = baseStatus.trim();
  if (normalized === JOB_OFFER_ERP_STATUS_ACCEPTED) {
    return APPLICANT_PIPELINE_OFFER_ACCEPTED;
  }
  if (normalized === JOB_OFFER_ERP_STATUS_REJECTED) {
    return APPLICANT_PIPELINE_OFFER_DECLINED;
  }
  if (/reject/i.test(normalized) && !/offer/i.test(normalized)) {
    return APPLICANT_PIPELINE_REJECTED;
  }
  if (/offer accepted|accepted offer/i.test(normalized)) {
    return APPLICANT_PIPELINE_OFFER_ACCEPTED;
  }
  if (/offer declined|declined offer/i.test(normalized)) {
    return APPLICANT_PIPELINE_OFFER_DECLINED;
  }
  if (hasScheduledInterview(interviews) || interviews.length > 0) {
    return APPLICANT_PIPELINE_INTERVIEWING;
  }
  return APPLICANT_PIPELINE_APPLIED;
}

export function applicantOfferCanRespond(offer: ERPNextJobOfferRow): boolean {
  return offer.docstatus === 1 && offer.status === JOB_OFFER_ERP_STATUS_AWAITING;
}

function mapInterviewRow(row: ERPNextInterviewRow): ApplicantInterviewSummary | null {
  const id = row.name?.trim();
  if (!id) return null;
  return {
    id,
    scheduledOn: row.scheduled_on?.trim() || "—",
    fromTime: row.from_time?.trim(),
    toTime: row.to_time?.trim(),
    status: row.status?.trim() || "—",
    roundOrType: row.interview_round?.trim() || row.interview_type?.trim(),
  };
}

function mapOfferForApplication(offer: ERPNextJobOfferRow): ApplicantOfferForApplication | null {
  const id = offer.name?.trim();
  if (!id) return null;
  return {
    id,
    status: offer.status?.trim() || "—",
    designation: offer.designation?.trim() || "—",
    offerDate: formatOfferDate(offer.offer_date),
    company: offer.company?.trim() || "—",
    docstatus: offer.docstatus ?? 0,
    canRespond: applicantOfferCanRespond(offer),
  };
}

function formatAppliedAt(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

async function mapJobApplicantRowsToApplications(
  rows: ERPNextJobApplicantRow[],
  offersByApplicantId: Map<string, ERPNextJobOfferRow>,
  interviewsByApplicantId: Map<string, ERPNextInterviewRow[]>,
): Promise<ApplicantApplication[]> {
  const openingField = getERPNextJobApplicantOpeningField();
  const out: ApplicantApplication[] = [];
  for (const row of rows) {
    const appId = row.name?.trim() ?? "";
    const openingIdRaw = (row as Record<string, unknown>)[openingField];
    const openingId = typeof openingIdRaw === "string" ? openingIdRaw : row.job_title;
    const job = openingId ? await getJobById(openingId) : null;
    const baseStatus = row.status?.trim() || "Submitted";
    const interviews = interviewsByApplicantId.get(appId) ?? [];
    const offer = appId ? offersByApplicantId.get(appId) : undefined;
    const displayStatus = resolveApplicantDisplayStatus(baseStatus, interviews, offer);
    out.push({
      id: appId,
      jobTitle: job?.title ?? openingId ?? "Job opening",
      appliedAt: formatAppliedAt(row.creation),
      status: baseStatus,
      displayStatus,
    });
  }
  return out;
}

async function loadOffersAndInterviewsForApplicants(
  applicantRows: ERPNextJobApplicantRow[],
): Promise<{
  offersByApplicantId: Map<string, ERPNextJobOfferRow>;
  interviewsByApplicantId: Map<string, ERPNextInterviewRow[]>;
}> {
  const applicantIds = applicantRows
    .map((r) => r.name?.trim())
    .filter((n): n is string => Boolean(n));

  const offers = (await fetchERPNextJobOffersForJobApplicants(applicantIds)) ?? [];
  const offersByApplicantId = new Map<string, ERPNextJobOfferRow>();
  for (const appId of applicantIds) {
    const appOffers = offers.filter((o) => o.job_applicant?.trim() === appId);
    const picked = pickOfferForApplicant(appOffers, appId);
    if (picked) offersByApplicantId.set(appId, picked);
  }

  const interviewsByApplicantId = new Map<string, ERPNextInterviewRow[]>();
  await Promise.all(
    applicantIds.map(async (appId) => {
      const rows = (await fetchERPNextInterviewsForJobApplicant(appId)) ?? [];
      interviewsByApplicantId.set(appId, rows);
    }),
  );

  return { offersByApplicantId, interviewsByApplicantId };
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

  const { offersByApplicantId, interviewsByApplicantId } =
    await loadOffersAndInterviewsForApplicants(rows);
  return mapJobApplicantRowsToApplications(rows, offersByApplicantId, interviewsByApplicantId);
}

export type ApplicantJobOffer = {
  id: string;
  jobApplicantId: string;
  applicationJobTitle: string;
  designation: string;
  offerDate: string;
  status: string;
  company: string;
  docstatus: number;
  canRespond: boolean;
};

export type ApplicantJobOfferTerm = {
  offerTerm: string;
  value: string;
};

export type ApplicantJobOfferDetail = ApplicantJobOffer & {
  applicantName: string;
  applicantEmail: string;
  offerTerms: ApplicantJobOfferTerm[];
  termsHtml: string | null;
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
      docstatus: offer.docstatus ?? 0,
      canRespond: applicantOfferCanRespond(offer),
    });
  }
  return out.sort((a, b) => b.offerDate.localeCompare(a.offerDate));
}

/** One job offer for this candidate (ownership verified via Job Applicant → Candidate). */
export async function fetchApplicantJobOfferForCandidate(
  offerDocName: string,
  candidateDocName: string,
): Promise<(ApplicantJobOffer & { applicantName?: string }) | null> {
  const offerId = offerDocName.trim();
  const candidateId = candidateDocName.trim();
  if (!hasERPNextConfig() || !offerId || !candidateId) return null;

  const offers = await fetchJobOffersForCandidate(candidateId);
  const hit = offers.find((o) => o.id === offerId);
  if (!hit) return null;

  const applicant = hit.jobApplicantId ?
    await fetchERPNextJobApplicantByName(hit.jobApplicantId)
  : null;

  return {
    ...hit,
    applicantName: applicant?.applicant_name?.trim(),
  };
}

/** Full job offer document for the applicant detail page (terms, T&Cs, contact fields). */
export async function fetchApplicantJobOfferDetailForCandidate(
  offerDocName: string,
  candidateDocName: string,
): Promise<ApplicantJobOfferDetail | null> {
  const offerId = offerDocName.trim();
  const candidateId = candidateDocName.trim();
  if (!hasERPNextConfig() || !offerId || !candidateId) return null;

  const hit = await fetchApplicantJobOfferForCandidate(offerId, candidateId);
  if (!hit) return null;

  const raw = await fetchERPNextJobOfferByName(offerId, { frappeSessionCookie: null });
  if (!raw?.name) return null;

  const jobApplicantId = raw.job_applicant?.trim() ?? hit.jobApplicantId;
  if (jobApplicantId) {
    const applicant = await fetchERPNextJobApplicantByName(jobApplicantId);
    const candidateField = getERPNextJobApplicantCandidateField();
    const linked = applicant ? (applicant as Record<string, unknown>)[candidateField] : null;
    if (typeof linked !== "string" || linked.trim() !== candidateId) return null;
  }

  const offerTerms = (raw.offer_terms ?? [])
    .map((row) => ({
      offerTerm: row.offer_term?.trim() ?? "",
      value: row.value?.trim() ?? "",
    }))
    .filter((row) => row.offerTerm || row.value);

  return {
    ...hit,
    jobApplicantId: jobApplicantId || hit.jobApplicantId,
    designation: raw.designation?.trim() || hit.designation,
    offerDate: formatOfferDate(raw.offer_date) || hit.offerDate,
    status: raw.status?.trim() || hit.status,
    company: raw.company?.trim() || hit.company,
    docstatus: raw.docstatus ?? hit.docstatus,
    canRespond: applicantOfferCanRespond(raw),
    applicantName: raw.applicant_name?.trim() || hit.applicantName?.trim() || "—",
    applicantEmail: raw.applicant_email?.trim() || "—",
    offerTerms,
    termsHtml: raw.terms?.trim() || null,
  };
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
  interviews: ERPNextInterviewRow[],
  offerRow?: ERPNextJobOfferRow,
): Promise<ApplicantApplicationDetail | null> {
  const id = row.name?.trim();
  if (!id) return null;

  const openingField = getERPNextJobApplicantOpeningField();
  const openingIdRaw = (row as Record<string, unknown>)[openingField];
  const openingId = typeof openingIdRaw === "string" ? openingIdRaw : row.job_title ?? "";
  const job = openingId ? await getJobById(openingId) : null;
  const baseStatus = row.status?.trim() || "Submitted";
  const displayStatus = resolveApplicantDisplayStatus(baseStatus, interviews, offerRow);

  return {
    id,
    jobTitle: job?.title ?? (openingId || "Job opening"),
    appliedAt: formatAppliedAt(row.creation),
    status: baseStatus,
    displayStatus,
    applicantName: row.applicant_name?.trim() || "—",
    email: row.email_id?.trim() || "—",
    phone: row.phone_number?.trim() || "—",
    openingId: openingId || "—",
    jobLocation: job?.location,
    jobDepartment: job?.department,
    resumeAttachment: row.resume_attachment?.trim() || undefined,
    interviews: interviews
      .map(mapInterviewRow)
      .filter((i): i is ApplicantInterviewSummary => i !== null),
    offer: offerRow ? mapOfferForApplication(offerRow) : null,
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

  const [interviews, offers] = await Promise.all([
    fetchERPNextInterviewsForJobApplicant(appId),
    fetchERPNextJobOffersForJobApplicants([appId]),
  ]);
  const offer = pickOfferForApplicant(offers ?? [], appId);

  return mapJobApplicantRowToDetail(row, interviews ?? [], offer);
}

export async function getApplicantApplicationDetail(
  applicationDocName: string,
): Promise<ApplicantApplicationDetail | null> {
  const candidate = await getApplicantCandidateStrict();
  if (!candidate?.name) return null;
  return fetchApplicantApplicationForCandidate(applicationDocName, candidate.name);
}

/** Applicant-facing hiring pipeline (progress stepper). */
export const APPLICANT_STATUS_PIPELINE = [
  APPLICANT_PIPELINE_APPLIED,
  APPLICANT_PIPELINE_INTERVIEWING,
  APPLICANT_PIPELINE_OFFER_SENT,
  APPLICANT_PIPELINE_OFFER_ACCEPTED,
  APPLICANT_PIPELINE_OFFER_DECLINED,
  APPLICANT_PIPELINE_REJECTED,
] as const;

function pipelineIndexForDisplayStatus(status: string): number {
  const n = status.trim().toLowerCase();
  if (n === APPLICANT_PIPELINE_REJECTED.toLowerCase() || (/reject/i.test(n) && !/offer declined/i.test(n))) {
    return APPLICANT_STATUS_PIPELINE.indexOf(APPLICANT_PIPELINE_REJECTED);
  }
  if (n === APPLICANT_PIPELINE_OFFER_DECLINED.toLowerCase() || /offer declined|declined offer/i.test(n)) {
    return APPLICANT_STATUS_PIPELINE.indexOf(APPLICANT_PIPELINE_OFFER_DECLINED);
  }
  if (n === APPLICANT_PIPELINE_OFFER_ACCEPTED.toLowerCase() || /offer accepted|accepted offer/i.test(n)) {
    return APPLICANT_STATUS_PIPELINE.indexOf(APPLICANT_PIPELINE_OFFER_ACCEPTED);
  }
  if (
    n === APPLICANT_PIPELINE_OFFER_SENT.toLowerCase() ||
    /offer (?:sent|created)|awaiting response/i.test(n)
  ) {
    return APPLICANT_STATUS_PIPELINE.indexOf(APPLICANT_PIPELINE_OFFER_SENT);
  }
  if (n === APPLICANT_PIPELINE_INTERVIEWING.toLowerCase() || /interview/i.test(n)) {
    return APPLICANT_STATUS_PIPELINE.indexOf(APPLICANT_PIPELINE_INTERVIEWING);
  }
  return APPLICANT_STATUS_PIPELINE.indexOf(APPLICANT_PIPELINE_APPLIED);
}

/** Terminal negative outcomes for stepper styling (current step highlighted, no future steps). */
export function applicantStatusIsTerminalNegative(displayStatus: string): boolean {
  return (
    displayStatus === APPLICANT_PIPELINE_REJECTED ||
    displayStatus === APPLICANT_PIPELINE_OFFER_DECLINED
  );
}

/**
 * Whether a pipeline step before the active one should show as completed.
 * Offer Accepted and Offer Declined are mutually exclusive; Rejected skips the offer branch.
 */
export function isApplicantPipelineStepCompleted(
  step: string,
  stepIndex: number,
  activeIndex: number,
  displayStatus: string,
): boolean {
  if (stepIndex >= activeIndex) return false;

  if (displayStatus === APPLICANT_PIPELINE_OFFER_DECLINED && step === APPLICANT_PIPELINE_OFFER_ACCEPTED) {
    return false;
  }
  if (displayStatus === APPLICANT_PIPELINE_OFFER_ACCEPTED && step === APPLICANT_PIPELINE_OFFER_DECLINED) {
    return false;
  }
  if (displayStatus === APPLICANT_PIPELINE_REJECTED) {
    if (step === APPLICANT_PIPELINE_OFFER_ACCEPTED || step === APPLICANT_PIPELINE_OFFER_DECLINED) {
      return false;
    }
  }
  if (
    (displayStatus === APPLICANT_PIPELINE_OFFER_ACCEPTED ||
      displayStatus === APPLICANT_PIPELINE_OFFER_DECLINED) &&
    step === APPLICANT_PIPELINE_REJECTED
  ) {
    return false;
  }

  return true;
}

export function applicantStatusProgress(status: string): {
  steps: readonly string[];
  activeIndex: number;
} {
  const steps = APPLICANT_STATUS_PIPELINE;
  let activeIndex = steps.findIndex((s) => s.toLowerCase() === status.trim().toLowerCase());
  if (activeIndex < 0) activeIndex = pipelineIndexForDisplayStatus(status);
  return { steps, activeIndex };
}
