import type { CompanyId } from "@/lib/companies";
import type { Job } from "@/lib/jobs";

export type DemoErpJobOpeningRow = {
  name: string;
  job_title: string;
  designation: string;
  department?: string;
  location?: string;
  employment_type?: string;
  description?: string;
  company?: string;
  status: string;
  publish: number;
};

function desc(...paragraphs: string[]): string {
  return paragraphs.map((p) => `<p>${p}</p>`).join("");
}

export const DEMO_JOB_OPENINGS: Job[] = [
  {
    id: "aemg-senior-software-engineer",
    company: "aemg",
    title: "Senior Software Engineer (AEMG)",
    department: "Technology",
    location: "Hybrid — Melbourne",
    type: "Full-time",
    summary:
      "Build and scale internal digital systems for student onboarding and operations.",
    summaryHtml: desc(
      "Lead development of student-facing portals and internal workflow tools.",
      "You will partner with product owners across admissions and student services to ship reliable features on a modern web stack.",
    ),
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
    summaryHtml: desc(
      "Be the first point of contact for applicants exploring AEMG programs.",
      "Coordinate interviews, document checks, and offer communications with a student-first approach.",
    ),
  },
  {
    id: "aemg-student-support-officer",
    company: "aemg",
    title: "Student Support Officer (AEMG)",
    department: "Student Services",
    location: "On-site — Melbourne",
    type: "Full-time",
    summary:
      "Support enrolled students with wellbeing check-ins, referrals, and day-to-day enquiries.",
    summaryHtml: desc(
      "Help students navigate academic and personal challenges during their study journey.",
      "Work closely with academic staff and external providers to coordinate timely support.",
    ),
  },
  {
    id: "aemg-finance-officer",
    company: "aemg",
    title: "Finance Officer (AEMG)",
    department: "Finance",
    location: "Hybrid — Melbourne",
    type: "Full-time",
    summary:
      "Process tuition reconciliations, assist with month-end reporting, and support payroll queries.",
    summaryHtml: desc(
      "Maintain accurate student billing records and assist the finance manager with compliance reporting.",
      "Ideal for someone detail-oriented with ERP or student management system experience.",
    ),
  },
  {
    id: "aemg-marketing-coordinator",
    company: "aemg",
    title: "Marketing Coordinator (AEMG)",
    department: "Marketing",
    location: "Hybrid — Sydney",
    type: "Part-time",
    summary:
      "Coordinate campaigns, events, and content for domestic student recruitment.",
    summaryHtml: desc(
      "Support open days, digital campaigns, and partner school outreach.",
      "Strong writing skills and comfort with social channels are essential.",
    ),
  },
  {
    id: "aemg-it-support-analyst",
    company: "aemg",
    title: "IT Support Analyst (AEMG)",
    department: "Technology",
    location: "On-site — Melbourne",
    type: "Full-time",
    summary:
      "Provide desktop, SaaS, and classroom technology support for staff and students.",
    summaryHtml: desc(
      "Triage help-desk tickets, maintain asset registers, and document common fixes.",
      "Occasional after-hours support may be required during intake periods.",
    ),
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
    summaryHtml: desc(
      "Coordinate casework for international students across AIFE partner campuses.",
      "Build relationships with students, agents, and academic teams to improve retention.",
    ),
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
    summaryHtml: desc(
      "Own campaign calendars, brief creative assets, and report on lead quality.",
      "Six-month contract with possible extension based on intake performance.",
    ),
  },
  {
    id: "aife-accountant",
    company: "aife",
    title: "Accountant (AIFE)",
    department: "Accounts",
    location: "On-site — Sydney",
    type: "Full-time",
    summary:
      "Manage accounts payable/receivable, reconciliations, and management reporting for AIFE.",
    summaryHtml: desc(
      "Prepare monthly management accounts and support annual audit preparation.",
      "Experience with cloud accounting platforms and education sector billing is advantageous.",
    ),
  },
  {
    id: "aife-enrolments-officer",
    company: "aife",
    title: "Enrolments Officer (AIFE)",
    department: "Admissions",
    location: "Hybrid — Sydney",
    type: "Full-time",
    summary:
      "Process enrolment documentation, verify prerequisites, and issue confirmation letters.",
    summaryHtml: desc(
      "Work with agents and direct applicants to complete enrolment accurately and on time.",
      "High volume periods align with major intake dates in February and July.",
    ),
  },
  {
    id: "aife-academic-coordinator",
    company: "aife",
    title: "Academic Coordinator (AIFE)",
    department: "Academic Services",
    location: "On-site — Phnom Penh",
    type: "Full-time",
    summary:
      "Schedule classes, support faculty onboarding, and monitor delivery quality across programs.",
    summaryHtml: desc(
      "Liaise between academic leads and student services to resolve timetable and assessment issues.",
      "Strong organisational skills and experience in higher education administration preferred.",
    ),
  },
  {
    id: "aife-pathway-counsellor",
    company: "aife",
    title: "Pathway Counsellor (AIFE)",
    department: "Student Success",
    location: "Hybrid — Melbourne",
    type: "Part-time",
    summary:
      "Advise pathway students on course progression, visa compliance touchpoints, and career planning.",
    summaryHtml: desc(
      "Conduct one-on-one counselling sessions and group workshops for foundation and diploma cohorts.",
      "Culturally sensitive communication and CRM note-taking are part of daily work.",
    ),
  },
];

const demoById = new Map(DEMO_JOB_OPENINGS.map((j) => [j.id, j] as const));

export function isDemoJobOpeningId(id: string): boolean {
  return demoById.has(id.trim());
}

export function getDemoJobOpeningById(id: string): Job | undefined {
  return demoById.get(id.trim());
}

export function demoJobOpeningsForCompany(company: CompanyId): Job[] {
  return DEMO_JOB_OPENINGS.filter((j) => j.company === company);
}

export function mergeJobsWithDemoOpenings(company: CompanyId, jobs: Job[]): Job[] {
  const ids = new Set(jobs.map((j) => j.id));
  const extras = demoJobOpeningsForCompany(company).filter((j) => !ids.has(j.id));
  return [...jobs, ...extras];
}

function erpCompanyLabel(company: CompanyId): string {
  return company === "aife" ? "AIFE" : "AEMG";
}

export function demoJobOpeningAsErpRow(job: Job): DemoErpJobOpeningRow {
  const designation = job.title.replace(/ \((AEMG|AIFE)\)$/, "");
  return {
    name: job.id,
    job_title: job.title,
    designation,
    department: job.department,
    location: job.location,
    employment_type: job.type,
    description: job.summaryHtml ?? `<p>${job.summary}</p>`,
    company: erpCompanyLabel(job.company),
    status: "Open",
    publish: 1,
  };
}

export function mergeErpRowsWithDemoOpenings<
  T extends { name?: string },
>(rows: T[]): Array<T | DemoErpJobOpeningRow> {
  const ids = new Set(
    rows.map((r) => r.name?.trim()).filter((n): n is string => Boolean(n)),
  );
  const extras = DEMO_JOB_OPENINGS.filter((j) => !ids.has(j.id)).map(demoJobOpeningAsErpRow);
  return [...rows, ...extras];
}
