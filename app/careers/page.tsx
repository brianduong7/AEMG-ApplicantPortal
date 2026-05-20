import type { Metadata } from "next";
import Link from "next/link";
import { CareersFooter } from "@/components/careers/careers-footer";
import { CareersNav } from "@/components/careers/careers-nav";
import { careerJobPath } from "@/lib/careers";
import { getPublicCareerJobs, PUBLIC_CAREERS_BRAND } from "@/lib/careers-site";

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
  const jobs = await getPublicCareerJobs();

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <section className="relative isolate shrink-0 bg-[#0a1628]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgba(10,22,40,0.92), rgba(13,79,110,0.75)), url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80')",
          }}
          aria-hidden
        />
        <CareersNav variant="hero" />
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-24 sm:px-6 sm:pb-16 sm:pt-28">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Careers</p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            Careers at {PUBLIC_CAREERS_BRAND.shortLabel}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/85 sm:text-base">
            Browse current openings at the Australia Institute of Future Education. Select a role to
            read the full description and apply online.
          </p>
          <Link
            href="/home"
            className="mt-6 inline-block text-sm font-medium text-sky-200 hover:underline"
          >
            ← Recruitment portals
          </Link>
        </div>
      </section>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-12 sm:px-6">
        {jobs.length === 0 ?
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-600">
            No open {PUBLIC_CAREERS_BRAND.shortLabel} roles at the moment. Check back soon or contact{" "}
            <a href="mailto:careers@aife.edu.au" className="font-medium text-[#0d4f6e] hover:underline">
              careers@aife.edu.au
            </a>
            .
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
    </div>
  );
}
