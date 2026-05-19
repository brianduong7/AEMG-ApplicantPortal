import type { Metadata } from "next";
import Link from "next/link";
import { CareersFooter } from "@/components/careers/careers-footer";
import { CareersNav } from "@/components/careers/careers-nav";
import { careerJobPath, getPublishedCareerJobs } from "@/lib/careers";

export const metadata: Metadata = {
  title: "Careers",
};

export const dynamic = "force-dynamic";

function IconClock() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export default async function CareersIndexPage() {
  const jobs = await getPublishedCareerJobs();

  return (
    <>
      <section className="relative isolate bg-slate-900">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgba(15,23,42,0.9), rgba(30,41,59,0.8)), url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1600&q=80')",
          }}
          aria-hidden
        />
        <CareersNav variant="hero" />
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-24 sm:px-6 sm:pb-16 sm:pt-28">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Recruit</p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Careers at AEMG</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/85 sm:text-base">
            Browse published openings. Each role page shows how the posting appears on the public
            careers website.
          </p>
          <Link
            href="/home"
            className="mt-6 inline-block text-sm font-medium text-[#7dd3fc] hover:underline"
          >
            ← Back to recruitment portals
          </Link>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {jobs.length === 0 ?
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-600">
            No published job openings yet. Mark an opening as{" "}
            <strong className="font-semibold text-slate-800">Open</strong> and enable{" "}
            <strong className="font-semibold text-slate-800">Publish on website</strong> in the
            staff portal.
          </p>
        : <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={careerJobPath(job)}
                  className="flex flex-col gap-2 px-5 py-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{job.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {[job.department, job.location, job.employmentType]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {job.postedAt ?
                    <span className="flex shrink-0 items-center gap-1 text-xs text-slate-500">
                      <IconClock />
                      {job.postedAt}
                    </span>
                  : null}
                </Link>
              </li>
            ))}
          </ul>
        }
      </main>

      <CareersFooter />
    </>
  );
}
