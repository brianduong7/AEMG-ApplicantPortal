import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getApplicantCandidateStrict } from "@/lib/applicant-candidate";
import { fetchJobOffersForCandidate } from "@/lib/applications";
import { hasERPNextConfig } from "@/lib/erpnext";
import { getPortalTheme } from "@/lib/portal-theme";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Job offers — Applicant Portal",
};

export default async function ApplicantJobOffersPage() {
  const session = await getSession();
  if (!session) redirect("/applicant/login?intent=applicant");

  const t = getPortalTheme(session.company);
  const erpConfigured = hasERPNextConfig();
  const candidate = erpConfigured ? await getApplicantCandidateStrict() : null;
  const offers = candidate?.name
    ? await fetchJobOffersForCandidate(candidate.name)
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className={t.pageTitle}>Job offers</h1>
        <p className={t.pageSubtitle}>
          Formal offers from employers for your applications (linked to your Job
          Applicant records in the system).
        </p>
      </div>

      <section className={t.applySection}>
        {!erpConfigured ? (
          <p className={t.applySectionHint}>
            Offers cannot be loaded yet — API keys are not configured on
            this server.
          </p>
        ) : !candidate?.name ? (
          <p className={t.applySectionHint}>
            No Candidate profile is linked to your account, so offers cannot be
            listed. Complete registration or ask HR to link your user to a
            Candidate in the system.
          </p>
        ) : offers.length === 0 ? (
          <p className={t.applySectionHint}>
            No job offers yet. When HR creates a Job Offer for one of your
            applications, it will appear here with its status.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Role / designation</th>
                  <th className="px-4 py-3">Application</th>
                  <th className="px-4 py-3">Offer date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Company</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {offers.map((row) => (
                  <tr
                    key={row.id || row.jobApplicantId}
                    className="hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.designation}
                    </td>
                    <td
                      className="max-w-[220px] truncate px-4 py-3 text-slate-700"
                      title={row.applicationJobTitle}
                    >
                      {row.applicationJobTitle}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {row.offerDate}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                        {row.status}
                      </span>
                    </td>
                    <td
                      className="max-w-[160px] truncate px-4 py-3 text-slate-600"
                      title={row.company}
                    >
                      {row.company}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-slate-100 px-4 py-2 font-mono text-[11px] text-slate-400">
              Offer documents are managed in the system; status updates appear here
              on refresh.
            </p>
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-4">
        <Link href="/applicant/applications" className={t.backLink}>
          ← My applications
        </Link>
        <Link href="/applicant/jobs" className={t.backLink}>
          Browse open roles
        </Link>
      </div>
    </div>
  );
}
