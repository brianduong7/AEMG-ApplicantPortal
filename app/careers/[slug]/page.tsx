import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CareersApplyCta } from "@/components/careers/careers-apply-cta";
import { CareersFooter } from "@/components/careers/careers-footer";
import { CareersHero } from "@/components/careers/careers-hero";
import { CareersRecentPosts } from "@/components/careers/careers-recent-posts";
import { careerJobPath, getCareerJobBySlug } from "@/lib/careers";
import { CAREERS_JOB_HTML_CLASS } from "@/lib/careers-site-classes";
import { getPublicCareerJobs, PUBLIC_CAREERS_COMPANY } from "@/lib/careers-site";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const job = await getCareerJobBySlug(decodeURIComponent(slug), PUBLIC_CAREERS_COMPANY);
  if (!job) return { title: "Role not found" };
  return { title: job.title };
}

export default async function CareersJobPage({ params }: Props) {
  const { slug } = await params;
  const job = await getCareerJobBySlug(decodeURIComponent(slug), PUBLIC_CAREERS_COMPANY);
  if (!job) notFound();

  const aifeJobs = await getPublicCareerJobs();
  const hasHtml = Boolean(job.descriptionHtml?.trim());
  const metaLine = [job.department, job.location, job.employmentType].filter(Boolean).join(" · ");

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <CareersHero
        title={job.title}
        jobCode={job.id}
        postedAt={job.postedAt}
        category={job.department}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-12">
          <article className="min-w-0">
            {metaLine ?
              <p className="mb-6 text-sm text-slate-600">{metaLine}</p>
            : null}
            {hasHtml ?
              <div
                className={CAREERS_JOB_HTML_CLASS}
                dangerouslySetInnerHTML={{ __html: job.descriptionHtml }}
              />
            : <p className="text-slate-600">No job description has been added for this opening yet.</p>}
          </article>
          <CareersRecentPosts jobs={aifeJobs} currentSlug={job.slug} />
        </div>

        <p className="mt-8 shrink-0 text-center text-xs text-slate-500">
          <Link href="/careers" className="font-medium text-[#0d4f6e] hover:underline">
            ← All careers at AIFE
          </Link>
        </p>
      </main>

      <CareersApplyCta jobId={job.id} jobTitle={job.title} />
      <CareersFooter />
    </div>
  );
}
