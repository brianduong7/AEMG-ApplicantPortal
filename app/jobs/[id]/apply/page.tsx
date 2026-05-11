import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ApplyForm } from "@/components/apply-form";
import { JobDescriptionBox } from "@/components/job-description-box";
import { getJobById, getJobsByCompany } from "@/lib/jobs";
import { getPortalTheme } from "@/lib/portal-theme";
import { getSession } from "@/lib/session";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) return { title: "Role not found" };
  return { title: `Apply — ${job.title}` };
}

export default async function ApplyPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  const t = getPortalTheme(session.company);
  const jobs = await getJobsByCompany(session.company);
  /** Ensure the role from the URL is a real <option> so `jobOpening` submits the doc name, not a wrong row. */
  const jobsForForm = jobs.some((j) => j.id === job.id)
    ? jobs
    : [job, ...jobs];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/jobs" className={t.backLink}>
          ← All roles
        </Link>
        <h1 className={`mt-4 ${t.pageTitle}`}>Apply for {job.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className={t.jobPillPrimary}>{job.department}</span>
          <span className={t.jobPillMuted}>{job.location}</span>
          <span className={t.jobPillMuted}>{job.type}</span>
        </div>
        <JobDescriptionBox text={job.summary} />
      </div>

      <section className={t.applySection}>
        <h2 className={t.applySectionTitle}>Your application</h2>
        <p className={t.applySectionHint}>
          Fields marked with <span className="text-red-600">*</span> are required.
        </p>
        <div className="mt-6">
          <ApplyForm
            jobs={jobsForForm}
            initialJobId={job.id}
            company={session.company}
          />
        </div>
      </section>
    </div>
  );
}
