import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getApplicantCandidateStrict } from "@/lib/applicant-candidate";
import { fetchJobOffersForCandidate, jobOfferStatusDisplayLabel } from "@/lib/applications";
import { hasERPNextConfig } from "@/lib/erpnext";
import { getPortalTheme } from "@/lib/portal-theme";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "My Offer — Applicant Portal",
};

export default async function ApplicantMyOffersPage() {
  const session = await getSession();
  if (!session) redirect("/applicant/login?intent=applicant");

  const t = getPortalTheme(session.company);
  const erpConfigured = hasERPNextConfig();
  const candidate = erpConfigured ? await getApplicantCandidateStrict() : null;
  const offers = candidate?.name ? await fetchJobOffersForCandidate(candidate.name) : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className={t.pageTitle}>My Offer</h1>
        <p className={t.pageSubtitle}>
          All job offers linked to your candidate profile across your applications.
        </p>
      </div>

      <section className={t.applySection}>
        {!erpConfigured ?
          <p className={t.applySectionHint}>
            Offers cannot be loaded yet — API keys are not configured on this server.
          </p>
        : !candidate?.name ?
          <p className={t.applySectionHint}>
            No candidate profile is linked to your account. Complete registration or ask HR to
            link your user to a Candidate record.
          </p>
        : offers.length === 0 ?
          <p className={t.applySectionHint}>
            No job offers yet. When HR sends an offer for one of your applications, it will appear
            here.
          </p>
        : <ul className="flex flex-col gap-3">
            {offers.map((row) => (
              <li key={row.id || row.jobApplicantId}>
                <Link
                  href={
                    row.id ?
                      `/applicant/my-offers/${encodeURIComponent(row.id)}`
                    : "/applicant/my-offers"
                  }
                  className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{row.designation}</p>
                      <p className="mt-1 text-sm text-slate-600">{row.applicationJobTitle}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {row.company} · Offer date {row.offerDate}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        row.canRespond ?
                          "bg-amber-100 text-amber-900"
                        : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {row.canRespond ?
                        "Awaiting your response"
                      : jobOfferStatusDisplayLabel(row.status)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        }
      </section>

      <div className="flex flex-wrap gap-4">
        <Link href="/applicant/applications" className={t.backLink}>
          ← My applications
        </Link>
      </div>
    </div>
  );
}
