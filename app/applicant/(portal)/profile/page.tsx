import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getApplicantCandidateStrict } from "@/lib/applicant-candidate";
import { COMPANIES } from "@/lib/companies";
import { getPortalTheme } from "@/lib/portal-theme";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "My info — Applicant Portal",
};

export default async function ApplicantProfilePage() {
  const session = await getSession();
  if (!session) redirect("/applicant/login?intent=applicant");

  const t = getPortalTheme(session.company);
  const company = COMPANIES[session.company];
  const candidate = await getApplicantCandidateStrict();

  const linkedin =
    candidate && typeof candidate === "object" ?
      (candidate as { linkedin?: string; custom_linkedin?: string }).linkedin ??
      (candidate as { custom_linkedin?: string }).custom_linkedin
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className={t.pageTitle}>My info</h1>
        <p className={t.pageSubtitle}>Your applicant profile from ERPNext.</p>
      </div>

      <section className={t.applySection}>
        <h2 className={t.applySectionTitle}>Profile details</h2>
        {!candidate?.name ? (
          <p className={`mt-3 ${t.applySectionHint}`}>
            No Candidate document is linked to your user yet. After registration this should appear
            automatically; otherwise ask your HR administrator to link your ERPNext user to a
            Candidate.
          </p>
        ) : (
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Full name</dt>
              <dd className="mt-1 text-slate-900">{candidate.full_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Email</dt>
              <dd className="mt-1 text-slate-900">{candidate.email ?? session.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Phone</dt>
              <dd className="mt-1 text-slate-900">{candidate.phone?.trim() || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">LinkedIn</dt>
              <dd className="mt-1 text-slate-900">{linkedin?.trim() || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Company portal</dt>
              <dd className="mt-1 text-slate-900">{company.label}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Candidate ID</dt>
              <dd className="mt-1 font-mono text-sm text-slate-800">{candidate.name}</dd>
            </div>
          </dl>
        )}
      </section>

      <div>
        <Link href="/applicant/jobs" className={t.backLink}>
          ← Back to open roles
        </Link>
      </div>
    </div>
  );
}
