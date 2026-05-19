import type { CompanyId } from "@/lib/companies";
import { assignUniqueCareerSlugs, slugifyJobTitle } from "@/lib/careers-slug";
import { fetchERPNextPublishedJobOpenings } from "@/lib/erpnext";
import { normalizeJobDescriptionForEditor } from "@/lib/job-description-html";

export type CareerJob = {
  id: string;
  slug: string;
  company: CompanyId;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  descriptionHtml: string;
  postedAt: string | null;
};

function companyIdFromERP(erpCompany?: string): CompanyId {
  const raw = erpCompany?.trim();
  if (!raw) return "aemg";
  const aife = (process.env.ERPNEXT_AIFE_COMPANY ?? "AIFE").trim().toLowerCase();
  const aemg = (process.env.ERPNEXT_AEMG_COMPANY ?? "AEMG").trim().toLowerCase();
  if (raw.toLowerCase() === aife) return "aife";
  if (raw.toLowerCase() === aemg) return "aemg";
  return "aemg";
}

function formatPostedDate(iso?: string): string | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function mapRow(row: {
  name?: string;
  job_title?: string;
  designation?: string;
  department?: string;
  location?: string;
  employment_type?: string;
  description?: string;
  company?: string;
  creation?: string;
  modified?: string;
}): CareerJob | null {
  const id = typeof row.name === "string" ? row.name.trim() : "";
  if (!id) return null;
  const title = (row.job_title ?? row.designation ?? "Role").trim();
  const rawDesc = (row.description ?? "").trim();
  const descriptionHtml = normalizeJobDescriptionForEditor(rawDesc);
  return {
    id,
    slug: "",
    company: companyIdFromERP(row.company),
    title,
    department: row.department?.trim() || "Recruit",
    location: row.location?.trim() || "",
    employmentType: row.employment_type?.trim() || "",
    descriptionHtml,
    postedAt: formatPostedDate(row.creation ?? row.modified),
  };
}

export async function getPublishedCareerJobs(): Promise<CareerJob[]> {
  const rows = await fetchERPNextPublishedJobOpenings();
  if (!rows?.length) return [];
  const mapped = rows.map(mapRow).filter((j): j is CareerJob => j !== null);
  return assignUniqueCareerSlugs(mapped);
}

export async function getCareerJobByDocId(docId: string): Promise<CareerJob | undefined> {
  const trimmed = docId.trim();
  if (!trimmed) return undefined;
  const jobs = await getPublishedCareerJobs();
  return jobs.find((j) => j.id === trimmed);
}

export async function getCareerJobBySlug(slug: string): Promise<CareerJob | undefined> {
  const trimmed = slug.trim().toLowerCase();
  if (!trimmed) return undefined;

  const jobs = await getPublishedCareerJobs();
  const bySlug = jobs.find((j) => j.slug === trimmed);
  if (bySlug) return bySlug;

  const byTitleSlug = jobs.find((j) => slugifyJobTitle(j.title) === trimmed);
  if (byTitleSlug) return byTitleSlug;

  const byId = jobs.find(
    (j) => j.id.toLowerCase() === trimmed || encodeURIComponent(j.id).toLowerCase() === trimmed,
  );
  return byId;
}

export function careerJobPath(job: Pick<CareerJob, "slug">): string {
  return `/careers/${encodeURIComponent(job.slug)}`;
}

export async function getCareerJobsForCompany(company: CompanyId): Promise<CareerJob[]> {
  const jobs = await getPublishedCareerJobs();
  return jobs.filter((j) => j.company === company);
}
