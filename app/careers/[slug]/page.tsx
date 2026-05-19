import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CareersApplyForm } from "@/components/careers/careers-apply-form";
import { CareersFooter } from "@/components/careers/careers-footer";
import { CareersHero } from "@/components/careers/careers-hero";
import { CareersRecentPosts } from "@/components/careers/careers-recent-posts";
import { careerJobPath, getCareerJobBySlug, getPublishedCareerJobs } from "@/lib/careers";
import { CAREERS_JOB_HTML_CLASS } from "@/lib/careers-site-classes";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const job = await getCareerJobBySlug(decodeURIComponent(slug));
  if (!job) return { title: "Role not found" };
  return { title: job.title };
}

export default async function CareersJobPage({ params }: Props) {
  const { slug } = await params;
  const job = await getCareerJobBySlug(decodeURIComponent(slug));
  if (!job) notFound();

  const allJobs = await getPublishedCareerJobs();
  const hasHtml = Boolean(job.descriptionHtml?.trim());

  return (
    <>
      <CareersHero title={job.title} postedAt={job.postedAt} category={job.department} />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-12">
          <article className="min-w-0">
            {hasHtml ?
              <div
                className={CAREERS_JOB_HTML_CLASS}
                dangerouslySetInnerHTML={{ __html: job.descriptionHtml }}
              />
            : <p className="text-slate-600">No job description has been added for this opening yet.</p>}
          </article>
          <CareersRecentPosts jobs={allJobs} currentSlug={job.slug} />
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          <Link href="/careers" className="font-medium text-[#0096d6] hover:underline">
            ← All careers
          </Link>
          {" · "}
          <Link
            href={`/staff/openings/${encodeURIComponent(job.id)}`}
            className="font-medium text-slate-600 hover:underline"
          >
            Staff portal view
          </Link>
        </p>
      </main>

      <CareersApplyForm jobTitle={job.title} jobId={job.id} company={job.company} />
      <CareersFooter />
    </>
  );
}
