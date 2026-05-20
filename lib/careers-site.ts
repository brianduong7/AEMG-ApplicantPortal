import type { CompanyId } from "@/lib/companies";
import { COMPANIES } from "@/lib/companies";
import { getPublicCareerJobsForCompany, type CareerJob } from "@/lib/careers";

/** Public careers website brand (AIFE openings only). */
export const PUBLIC_CAREERS_COMPANY: CompanyId = "aife";

export const PUBLIC_CAREERS_BRAND = COMPANIES[PUBLIC_CAREERS_COMPANY];

export async function getPublicCareerJobs(): Promise<CareerJob[]> {
  return getPublicCareerJobsForCompany(PUBLIC_CAREERS_COMPANY);
}

export async function getPublicCareerJobByDocId(docId: string): Promise<CareerJob | undefined> {
  const trimmed = docId.trim();
  if (!trimmed) return undefined;
  const jobs = await getPublicCareerJobs();
  return jobs.find((j) => j.id === trimmed);
}

export function applicantApplyPath(jobId: string): string {
  return `/applicant/jobs/${encodeURIComponent(jobId)}/apply`;
}

export function applicantLoginHref(jobId: string): string {
  const from = applicantApplyPath(jobId);
  const params = new URLSearchParams({
    company: PUBLIC_CAREERS_COMPANY,
    intent: "applicant",
    from,
  });
  return `/applicant/login?${params.toString()}`;
}

export function applicantRegisterHref(jobId: string): string {
  const from = applicantApplyPath(jobId);
  const params = new URLSearchParams({
    company: PUBLIC_CAREERS_COMPANY,
    from,
  });
  return `/applicant/register?${params.toString()}`;
}
