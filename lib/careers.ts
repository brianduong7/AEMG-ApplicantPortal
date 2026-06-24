import type { CompanyId } from "@/lib/companies";
import { assignUniqueCareerSlugs, slugifyJobTitle } from "@/lib/careers-slug";
import {
  demoJobOpeningAsErpRow,
  demoJobOpeningsForCompany,
} from "@/lib/demo-job-openings";
import {
  fetchERPNextPublicCareerJobOpenings,
  fetchERPNextPublishedJobOpenings,
} from "@/lib/erpnext";
import { prepareJobDescriptionForDisplay } from "@/lib/job-description-html";

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
  const lower = raw.toLowerCase();
  const aife = (process.env.ERPNEXT_AIFE_COMPANY ?? "AIFE").trim().toLowerCase();
  const aemg = (process.env.ERPNEXT_AEMG_COMPANY ?? "AEMG").trim().toLowerCase();
  if (lower === aife || lower.includes("aife") || lower.includes("future education")) {
    return "aife";
  }
  if (lower === aemg || lower.includes("aemg")) return "aemg";
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
  const descriptionHtml = prepareJobDescriptionForDisplay(rawDesc).html ?? "";
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

/** Public careers pages: open status only (no publish-on-website gate). */
export async function getPublicCareerJobsForCompany(company: CompanyId): Promise<CareerJob[]> {
  const rows = await fetchERPNextPublicCareerJobOpenings();
  const erpMapped =
    rows?.length ?
      rows
        .map(mapRow)
        .filter((j): j is CareerJob => j !== null && j.company === company)
    : [];
  const erpIds = new Set(erpMapped.map((j) => j.id));
  const demoMapped = demoJobOpeningsForCompany(company)
    .filter((j) => !erpIds.has(j.id))
    .map((job) => {
      const erp = demoJobOpeningAsErpRow(job);
      return mapRow({
        name: erp.name,
        job_title: erp.job_title,
        designation: erp.designation,
        department: erp.department,
        location: erp.location,
        employment_type: erp.employment_type,
        description: erp.description,
        company: erp.company,
        modified: new Date().toISOString(),
      });
    })
    .filter((j): j is CareerJob => j !== null);
  return assignUniqueCareerSlugs([...erpMapped, ...demoMapped]);
}

export async function getCareerJobByDocId(docId: string): Promise<CareerJob | undefined> {
  const trimmed = docId.trim();
  if (!trimmed) return undefined;
  const jobs = await getPublishedCareerJobs();
  return jobs.find((j) => j.id === trimmed);
}

export async function getCareerJobBySlug(
  slug: string,
  company?: CompanyId,
): Promise<CareerJob | undefined> {
  const trimmed = slug.trim().toLowerCase();
  if (!trimmed) return undefined;

  const jobs =
    company ? await getCareerJobsForCompany(company) : await getPublishedCareerJobs();
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
  return getPublicCareerJobsForCompany(company);
}
