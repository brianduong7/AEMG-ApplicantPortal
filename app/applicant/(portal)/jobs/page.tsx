import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortalTheme } from "@/lib/portal-theme";
import { getJobsByCompany } from "@/lib/jobs";
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
      <ul className="flex flex-col gap-4">
        {jobs.map((job) => (
          <li key={job.id}>
            <Link href={`/applicant/jobs/${job.id}/apply`} className={t.jobCard}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className={t.jobCardTitle}>{job.title}</h2>
                  <p
                    className={t.jobCardBody}
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {job.summary}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 text-xs">
                  <span className={t.jobPillPrimary}>{job.department}</span>
                  <span className={t.jobPillMuted}>{job.location}</span>
                  <span className={t.jobPillMuted}>{job.type}</span>
                </div>
              </div>
              <p className={t.jobApplyLink}>Apply →</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
