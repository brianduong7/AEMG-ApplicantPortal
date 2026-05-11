import type { CompanyId } from "@/lib/companies";

export type ApplicantApplication = {
  id: string;
  jobTitle: string;
  appliedAt: string;
  status: "Under review" | "Interview scheduled" | "Submitted";
};

const MOCK_APPLICATIONS: Record<CompanyId, ApplicantApplication[]> = {
  aemg: [
    {
      id: "app-aemg-001",
      jobTitle: "Senior Software Engineer (AEMG)",
      appliedAt: "2026-05-02",
      status: "Under review",
    },
  ],
  aife: [
    {
      id: "app-aife-001",
      jobTitle: "Student Support Coordinator (AIFE)",
      appliedAt: "2026-05-01",
      status: "Interview scheduled",
    },
  ],
};

export function getApplicationsForCompany(company: CompanyId): ApplicantApplication[] {
  return MOCK_APPLICATIONS[company];
}
