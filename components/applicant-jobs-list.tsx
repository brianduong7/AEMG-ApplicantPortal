"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Job } from "@/lib/jobs";
import { JOB_DESCRIPTION_PREVIEW_HTML_CLASS } from "@/lib/job-description-preview-classes";
import type { PortalTheme } from "@/lib/portal-theme";

type Props = {
  jobs: Job[];
  theme: PortalTheme;
};

export function ApplicantJobsList({ jobs, theme }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((job) => {
      const hay = `${job.title} ${job.id}`.toLowerCase();
      return hay.includes(q);
    });
  }, [jobs, query]);

  return (
    <div className="flex flex-col gap-6">
      <label className="flex flex-col gap-1.5">
        <span className="sr-only">Search job openings</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by job title or code…"
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
      </label>

      {filtered.length === 0 ?
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          {jobs.length === 0 ?
            "No open roles are available right now."
          : "No roles match your search."}
        </p>
      : <ul className="flex flex-col gap-4">
          {filtered.map((job) => (
            <li key={job.id}>
              <Link href={`/applicant/jobs/${job.id}/apply`} className={theme.jobCard}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h2 className={theme.jobCardTitle}>
                      {job.title}
                      <span className="ml-2 font-mono text-sm font-normal text-slate-400">
                        {job.id}
                      </span>
                    </h2>
                    {job.summaryHtml?.trim() ?
                      <div
                        className={`${JOB_DESCRIPTION_PREVIEW_HTML_CLASS} mt-2 max-h-[4.5rem] overflow-hidden`}
                        dangerouslySetInnerHTML={{ __html: job.summaryHtml.trim() }}
                      />
                    : <p
                        className={theme.jobCardBody}
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {job.summary}
                      </p>
                    }
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 text-xs">
                    <span className={theme.jobPillPrimary}>{job.department}</span>
                    <span className={theme.jobPillMuted}>{job.location}</span>
                    <span className={theme.jobPillMuted}>{job.type}</span>
                  </div>
                </div>
                <p className={theme.jobApplyLink}>Apply →</p>
              </Link>
            </li>
          ))}
        </ul>
      }
    </div>
  );
}
