import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OpeningForm } from "@/components/opening-form";
import {
  fetchERPNextJobApplicants,
  fetchERPNextJobOpeningByDocName,
  hasERPNextConfig,
} from "@/lib/erpnext";
import { requireRecruiterSession } from "@/lib/recruiter-session";

export const metadata: Metadata = {
  title: "Edit job opening — Recruiter",
};

type Props = {
  params: Promise<{ name: string }>;
};

export default async function RecruiterEditOpeningPage({ params }: Props) {
  await requireRecruiterSession();
  const { name } = await params;
  const decoded = decodeURIComponent(name);

  if (!hasERPNextConfig()) notFound();

  const row = await fetchERPNextJobOpeningByDocName(decoded);
  if (!row) notFound();

  const applicantsForOpening =
    (await fetchERPNextJobApplicants({
      jobOpeningDocName: decoded,
      limit: 150,
    })) ?? [];

  const initial = {
    jobTitle: row.job_title ?? "",
    designation: row.designation ?? "",
    department: row.department ?? "",
    employmentType: row.employment_type ?? "",
    location: row.location ?? "",
    description: row.description ?? "",
    status: row.status === "Closed" ? ("Closed" as const) : ("Open" as const),
    publish: row.publish === 1,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/recruiter/openings" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          ← Job openings
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Edit opening</h1>
        <p className="mt-1 font-mono text-xs text-slate-500">{decoded}</p>
      </div>
      <OpeningForm mode="edit" docName={decoded} initial={initial} />

      <section className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Applicants for this opening</h2>
            <p className="mt-1 text-sm text-slate-600">
              Click a name to open the applicant record (resume, interview scheduling).
            </p>
          </div>
          <Link
            href={`/recruiter/applicants?opening=${encodeURIComponent(decoded)}`}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            View all in list →
          </Link>
        </div>

        {applicantsForOpening.length === 0 ?
          <p className="mt-4 text-sm text-slate-600">
            No applicants linked to this opening in ERPNext yet.
          </p>
        : <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
            {applicantsForOpening.map((a) => {
              const id = a.name ?? "";
              if (!id) return null;
              return (
                <li key={id}>
                  <Link
                    href={`/recruiter/applicants/${encodeURIComponent(id)}`}
                    className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm transition hover:bg-slate-50/80"
                  >
                    <span className="font-medium text-blue-600 hover:underline">
                      {a.applicant_name ?? id}
                    </span>
                    <span className="text-slate-600">{a.email_id ?? "—"}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        }
      </section>
    </div>
  );
}
