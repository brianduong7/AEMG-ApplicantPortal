import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getApplicantCandidateStrict } from "@/lib/applicant-candidate";
import { fetchJobApplicantsForCandidate } from "@/lib/applications";
import { hasERPNextConfig } from "@/lib/erpnext";
import { getPortalTheme } from "@/lib/portal-theme";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "My applications — Applicant Portal",
};

export default async function ApplicantApplicationsPage() {
  const session = await getSession();
  if (!session) redirect("/applicant/login?intent=applicant");

  const t = getPortalTheme(session.company);

  const erpConfigured = hasERPNextConfig();
  const candidate = erpConfigured ? await getApplicantCandidateStrict() : null;

  const applications =
    candidate?.name ? await fetchJobApplicantsForCandidate(candidate.name) : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className={t.pageTitle}>
          My applications
        </h1>
        <p className={t.pageSubtitle}>
          Job applications you have submitted, linked to your Candidate profile in ERPNext.
        </p>
      </div>

      <section className={t.applySection}>
        {!erpConfigured ? (
          <p className={t.applySectionHint}>
            Applications cannot be loaded yet — ERPNext API keys are not configured on this
            server.
          </p>
        ) : !candidate?.name ? (
          <p className={t.applySectionHint}>
            No Candidate profile is linked to your account, so your applications cannot be listed.
            Complete registration or ask HR to link your user to a Candidate in ERPNext.
          </p>
        ) : applications.length === 0 ? (
          <p className={t.applySectionHint}>No applications yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {applications.map((app) => (
              <li
                key={app.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <p className="font-medium text-slate-900">{app.jobTitle}</p>
                <p className="mt-1 text-sm text-slate-600">
                  Applied on {app.appliedAt}
                </p>
                <p className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                  {app.status}
                </p>
              </li>
            ))}
          </ul>
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
