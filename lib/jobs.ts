import type { CompanyId } from "@/lib/companies";
import { COMPANY_IDS } from "@/lib/companies";
import { fetchERPNextJobOpeningByDocName, fetchERPNextJobs } from "@/lib/erpnext";

export type Job = {
  id: string;
  company: CompanyId;
  title: string;
  department: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract";
  summary: string;
};

const FALLBACK_JOBS: Job[] = [
  {
    id: "aemg-senior-software-engineer",
    company: "aemg",
    title: "Senior Software Engineer (AEMG)",
    department: "Technology",
    location: "Hybrid — Melbourne",
    type: "Full-time",
    summary:
      "Build and scale internal digital systems for student onboarding and operations.",
  },
  {
    id: "aemg-campus-admissions-officer",
    company: "aemg",
    title: "Campus Admissions Officer (AEMG)",
    department: "Admissions",
    location: "On-site — Melbourne",
    type: "Full-time",
    summary:
      "Guide prospective students through admission, documentation, and enrollment steps.",
  },
  {
    id: "aife-student-support-coordinator",
    company: "aife",
    title: "Student Support Coordinator (AIFE)",
    department: "Student Services",
    location: "On-site — Phnom Penh",
    type: "Full-time",
    summary:
      "Support student wellbeing and academic progress across partner programs.",
  },
  {
    id: "aife-marketing-executive",
    company: "aife",
    title: "Marketing Executive (AIFE)",
    department: "Marketing",
    location: "Hybrid — Sydney",
    type: "Contract",
    summary:
      "Plan and execute digital campaigns for education products and international outreach.",
  },
];

function normalizeType(value?: string): Job["type"] {
  if (value === "Part-time") return "Part-time";
  if (value === "Contract") return "Contract";
  return "Full-time";
}

function toPlainText(value?: string): string {
  if (!value) return "";
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, "\"")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function companyIdFromERPCompanyField(erpCompany?: string): CompanyId {
  const raw = erpCompany?.trim();
  if (!raw) return "aemg";
  const aife = (process.env.ERPNEXT_AIFE_COMPANY ?? "AIFE").trim().toLowerCase();
  const aemg = (process.env.ERPNEXT_AEMG_COMPANY ?? "AEMG").trim().toLowerCase();
  if (raw.toLowerCase() === aife) return "aife";
  if (raw.toLowerCase() === aemg) return "aemg";
  return "aemg";
}

function mapERPJobToJob(company: CompanyId, source: {
  name?: string;
  job_title?: string;
  designation?: string;
  department?: string;
  location?: string;
  employment_type?: string;
  description?: string;
}): Job | null {
  const docName = typeof source.name === "string" ? source.name.trim() : "";
  if (!docName) {
    return null;
  }
  const title = source.job_title ?? source.designation ?? "Untitled role";
  return {
    id: docName,
    company,
    title,
    department: source.department ?? "General",
    location: source.location ?? "Not specified",
    type: normalizeType(source.employment_type),
    summary: toPlainText(source.description) || "No summary provided yet.",
  };
}

export async function getJobsByCompany(company: CompanyId): Promise<Job[]> {
  try {
    const remote = await fetchERPNextJobs(company);
    if (!remote) return FALLBACK_JOBS.filter((j) => j.company === company);
    return remote
      .map((job) => mapERPJobToJob(company, job))
      .filter((job): job is Job => job !== null);
  } catch {
    return FALLBACK_JOBS.filter((j) => j.company === company);
  }
}

export async function getJobById(id: string): Promise<Job | undefined> {
  const trimmed = id.trim();
  if (!trimmed) return undefined;

  for (const company of COMPANY_IDS) {
    const list = await getJobsByCompany(company);
    const hit = list.find((j) => j.id === trimmed);
    if (hit) return hit;
  }

  const direct = await fetchERPNextJobOpeningByDocName(trimmed);
  if (!direct) return undefined;
  const company = companyIdFromERPCompanyField(direct.company);
  const mapped = mapERPJobToJob(company, direct);
  return mapped ?? undefined;
}
