import type { Metadata } from "next";
import Link from "next/link";
import { fetchERPNextInterviewsForHr, hasERPNextConfig } from "@/lib/erpnext";
import { requireRecruiterSession } from "@/lib/recruiter-session";

export const metadata: Metadata = {
  title: "Interviews — Recruiter",
};

export default async function RecruiterInterviewsPage() {
  await requireRecruiterSession();

  if (!hasERPNextConfig()) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Interviews</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-600">
          Configure ERPNext to list interviews (
          <code className="rounded bg-slate-100 px-1">ERPNEXT_BASE_URL</code> and API credentials).
        </p>
      </div>
    );
  }

  const rows = (await fetchERPNextInterviewsForHr()) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Interviews</h1>
        <p className="mt-1 text-sm text-slate-600">
          Scheduled interviews from ERPNext HRMS.
        </p>
      </div>

      {rows.length === 0 ?
        <div className="rounded-xl border border-slate-200/80 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
          No interviews in scope yet. Schedule one from an applicant&apos;s detail page.
        </div>
      : <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Opening</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 font-mono text-[11px] normal-case">Doc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.name} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.job_applicant ?? "—"}</td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-slate-600" title={row.job_opening}>
                    {row.job_opening ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {[row.scheduled_on, row.from_time, row.to_time].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.interview_type ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                      {row.status ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }

      <p className="text-xs text-slate-500">
        Open an applicant from{" "}
        <Link href="/recruiter/applicants" className="font-medium text-blue-600 hover:underline">
          Job applicants
        </Link>{" "}
        to schedule interviews.
      </p>
    </div>
  );
}
