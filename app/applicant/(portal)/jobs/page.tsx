import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ApplicantJobsList } from "@/components/applicant-jobs-list";
import { getJobsByCompany } from "@/lib/jobs";
import { getPortalTheme } from "@/lib/portal-theme";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Open roles — Applicant Portal",
};

export default async function ApplicantJobsPage() {
  const session = await getSession();
  if (!session) redirect("/applicant/login?intent=applicant");

  const t = getPortalTheme(session.company);
  const jobs = await getJobsByCompany(session.company);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className={t.pageTitle}>Open roles</h1>
        <p className={t.pageSubtitle}>
          Choose a position to read the brief and submit your application.
        </p>
      </div>
      <ApplicantJobsList jobs={jobs} theme={t} />
    </div>
  );
}
