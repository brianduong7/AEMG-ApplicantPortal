import type { Metadata } from "next";
import Link from "next/link";
import {
  fetchERPNextJobApplicants,
  fetchERPNextJobOpeningsForHr,
  getERPNextJobApplicantOpeningField,
  hasERPNextConfig,
} from "@/lib/erpnext";
import { requireRecruiterSession } from "@/lib/recruiter-session";

export const metadata: Metadata = {
  title: "Applicants — Recruiter",
};

type Props = {
  searchParams?: Promise<{ opening?: string }>;
};

function openingLabel(
  openingId: string | undefined,
  openings: { name?: string; job_title?: string }[],
): string {
  if (!openingId) return "—";
  const hit = openings.find((o) => o.name === openingId);
  return hit?.job_title ?? openingId;
}

export default async function RecruiterApplicantsPage({ searchParams }: Props) {
  await requireRecruiterSession();
  const sp = (await searchParams) ?? {};
  const openingFilter =
    typeof sp.opening === "string" && sp.opening.trim() ? sp.opening.trim() : "";

  if (!hasERPNextConfig()) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Applicants</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-600">
          Configure ERPNext to list applicants linked to your company&apos;s job openings.
        </p>
      </div>
    );
  }

  const openings = await fetchERPNextJobOpeningsForHr();
  const openingRows = openings ?? [];
  const openingIds = openingRows
    .map((o) => o.name)
    .filter((n): n is string => typeof n === "string" && n.length > 0);

  let applicants: NonNullable<Awaited<ReturnType<typeof fetchERPNextJobApplicants>>> = [];

  if (openingFilter && !openingIds.includes(openingFilter)) {
    applicants = [];
  } else if (openingFilter) {
    applicants = (await fetchERPNextJobApplicants({
      jobOpeningDocName: openingFilter,
      limit: 500,
    })) ?? [];
  } else {
    applicants = (await fetchERPNextJobApplicants({ limit: 500 })) ?? [];
  }

  const rows = applicants ?? [];
  const linkField = getERPNextJobApplicantOpeningField();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Applicants</h1>
        <p className="mt-1 text-sm text-slate-600">
          All job applicants from ERPNext. Optionally filter by job opening.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get" action="/recruiter/applicants">
        <div className="flex flex-col gap-1">
          <label htmlFor="opening" className="text-xs font-medium text-slate-600">
            Job opening
          </label>
          <select
            id="opening"
            name="opening"
            defaultValue={openingFilter}
            className="min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
          >
            <option value="">All openings ({openingIds.length})</option>
            {openingRows.map((o) => {
              const id = o.name ?? "";
              if (!id) return null;
              const label = o.job_title ?? o.designation ?? id;
              return (
                <option key={id} value={id}>
                  {label} ({id})
                </option>
              );
            })}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Apply filter
        </button>
        {openingFilter ?
          <Link
            href="/recruiter/applicants"
            className="text-sm font-medium text-slate-600 underline hover:text-slate-900"
          >
            Clear filter
          </Link>
        : null}
      </form>

      {rows.length === 0 ?
        <p className="rounded-xl border border-slate-200/80 bg-white p-6 text-sm text-slate-600 shadow-sm">
          No applicants in this view yet.
        </p>
      : <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Opening</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const id = row.name ?? "";
                const openingId = (row as Record<string, string | undefined>)[linkField];
                return (
                  <tr key={id || row.email_id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {id ?
                        <Link
                          href={`/recruiter/applicants/${encodeURIComponent(id)}`}
                          className="text-blue-600 hover:underline"
                        >
                          {row.applicant_name ?? "—"}
                        </Link>
                      : (
                        (row.applicant_name ?? "—")
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.email_id ?? "—"}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-slate-600" title={openingId}>
                      {openingLabel(openingId, openingRows)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                        {row.status ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {id ?
                        <Link
                          href={`/recruiter/applicants/${encodeURIComponent(id)}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          Open
                        </Link>
                      : null}
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
