import type { Metadata } from "next";
import Link from "next/link";
import { requireRecruiterSession } from "@/lib/recruiter-session";
import {
  fetchERPNextJobOpeningsForHr,
  hasERPNextConfig,
} from "@/lib/erpnext";

export const metadata: Metadata = {
  title: "Job openings — Recruiter",
};

export default async function RecruiterOpeningsPage() {
  await requireRecruiterSession();

  if (!hasERPNextConfig()) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Job openings</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-600">
          Connect this app to ERPNext to load openings. Set{" "}
          <code className="rounded bg-slate-100 px-1">ERPNEXT_BASE_URL</code>,{" "}
          <code className="rounded bg-slate-100 px-1">ERPNEXT_API_KEY</code>, and{" "}
          <code className="rounded bg-slate-100 px-1">ERPNEXT_API_SECRET</code>.
        </p>
      </div>
    );
  }

  const rows = await fetchERPNextJobOpeningsForHr();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Job openings</h1>
          <p className="mt-1 text-sm text-slate-600">
            All job openings from ERPNext (no company filter).
          </p>
        </div>
        <Link
          href="/recruiter/openings/new"
          className="inline-flex w-fit items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          New opening
        </Link>
      </div>

      {!rows || rows.length === 0 ?
        <p className="rounded-xl border border-slate-200/80 bg-white p-6 text-sm text-slate-600 shadow-sm">
          No job openings returned for this company. Create one in ERPNext or use{" "}
          <Link href="/recruiter/openings/new" className="font-medium text-blue-600 hover:underline">
            New opening
          </Link>
          .
        </p>
      : <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Doc</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const id = row.name ?? "";
                const title = row.job_title ?? row.designation ?? "Untitled";
                return (
                  <tr key={id || title} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {id ?
                        <Link
                          href={`/recruiter/applicants?opening=${encodeURIComponent(id)}`}
                          className="text-blue-600 hover:underline"
                        >
                          {title}
                        </Link>
                      : (
                        title
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.designation ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                        {row.status ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{id || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {id ?
                          <>
                            <Link
                              href={`/recruiter/applicants?opening=${encodeURIComponent(id)}`}
                              className="font-medium text-blue-600 hover:underline"
                            >
                              Applicants
                            </Link>
                            <Link
                              href={`/recruiter/openings/${encodeURIComponent(id)}/edit`}
                              className="font-medium text-slate-800 underline decoration-slate-300 underline-offset-2 hover:text-blue-600"
                            >
                              Edit
                            </Link>
                          </>
                        : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      }
    </div>
  );
}
