import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { COMPANIES } from "@/lib/companies";
import { getPortalTheme } from "@/lib/portal-theme";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "My info — Applicant Portal",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const t = getPortalTheme(session.company);
  const company = COMPANIES[session.company];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className={t.pageTitle}>My info</h1>
        <p className={t.pageSubtitle}>Your applicant account details.</p>
      </div>

      <section className={t.applySection}>
        <h2 className={t.applySectionTitle}>Profile details</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Email</dt>
            <dd className="mt-1 text-slate-900">{session.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Company portal</dt>
            <dd className="mt-1 text-slate-900">{company.label}</dd>
          </div>
        </dl>
      </section>

      <div>
        <Link href="/jobs" className={t.backLink}>
          ← Back to open roles
        </Link>
      </div>
    </div>
  );
}
