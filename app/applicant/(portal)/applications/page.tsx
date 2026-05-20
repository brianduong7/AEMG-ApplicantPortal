import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ApplicantApplicationsList } from "@/components/applicant-applications-list";
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
          Job applications you have submitted, linked to your candidate profile.
        </p>
      </div>

      <section className={t.applySection}>
        {!erpConfigured ? (
          <p className={t.applySectionHint}>
            Applications cannot be loaded yet — recruitment services are not configured on this
            server.
          </p>
        ) : !candidate?.name ? (
          <p className={t.applySectionHint}>
            No Candidate profile is linked to your account, so your applications cannot be listed.
            Complete registration or ask HR to link your account to a candidate profile.
          </p>
        ) : (
          <ApplicantApplicationsList applications={applications} />
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
