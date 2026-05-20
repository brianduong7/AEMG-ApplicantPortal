"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ApplicantApplication } from "@/lib/applications";

type Props = {
  applications: ApplicantApplication[];
};

export function ApplicantApplicationsList({ applications }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter((app) => {
      const hay = `${app.jobTitle} ${app.id} ${app.displayStatus} ${app.status}`.toLowerCase();
      return hay.includes(q);
    });
  }, [applications, query]);

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="sr-only">Search applications</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by job title, code, or status…"
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
      </label>

      {filtered.length === 0 ?
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          {applications.length === 0 ?
            "No applications yet."
          : "No applications match your search."}
        </p>
      : <ul className="flex flex-col gap-3">
          {filtered.map((app) => (
            <li key={app.id}>
              <Link
                href={
                  app.id ?
                    `/applicant/applications/${encodeURIComponent(app.id)}`
                  : "/applicant/applications"
                }
                className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
              >
                <p className="font-medium text-slate-900">{app.jobTitle}</p>
                <p className="mt-1 text-sm text-slate-600">
                  Applied on {app.appliedAt}
                  {app.id ?
                    <span className="font-mono text-xs text-slate-400"> · {app.id}</span>
                  : null}
                </p>
                <p className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800">
                  {app.displayStatus}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      }
    </div>
  );
}
