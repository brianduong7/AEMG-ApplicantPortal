import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobOfferCommentsSection } from "@/components/job-offer-comments-section";
import { JobOfferHrPanel } from "@/components/job-offer-hr-panel";
import { toDesignationOptions } from "@/lib/designation-options";
import {
  fetchERPNextCommentsForDocument,
  fetchERPNextDesignations,
  fetchERPNextHrTermsAndConditions,
  fetchERPNextJobOfferByName,
  fetchERPNextJobOfferTermTemplates,
  fetchERPNextOfferTerms,
  hasERPNextConfig,
} from "@/lib/erpnext";
import { readStaffFrappeCookieHeader } from "@/lib/staff-erpnext-session";
import { staffCanApproveJobOffersForSession } from "@/lib/staff-roles";
import { requireStaffRoles } from "@/lib/staff-session";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

function workflowLabel(docstatus?: number): { label: string; className: string } {
  if (docstatus === 1) {
    return {
      label: "Submitted",
      className: "bg-blue-100 text-blue-900",
    };
  }
  if (docstatus === 2) {
    return {
      label: "Cancelled",
      className: "bg-slate-200 text-slate-700",
    };
  }
  return {
    label: "Draft",
    className: "bg-amber-100 text-amber-900",
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `${decodeURIComponent(id)} — Job offer`,
  };
}

export default async function StaffJobOfferDetailPage({ params }: Props) {
  const { session } = await requireStaffRoles([
    "d_recruiter",
    "d_hr",
    "d_executive",
    "super_admin",
  ]);
  const canApproveJobOffers = await staffCanApproveJobOffersForSession(session);

  const { id } = await params;
  const docName = decodeURIComponent(id);
  if (!hasERPNextConfig() || !docName.trim()) notFound();

  const frappeCookie = await readStaffFrappeCookieHeader();
  const [offer, designations, termsRows, templateRows, offerTermRows, offerComments] =
    await Promise.all([
    fetchERPNextJobOfferByName(docName, { frappeSessionCookie: frappeCookie }),
    fetchERPNextDesignations({ frappeSessionCookie: frappeCookie }),
    fetchERPNextHrTermsAndConditions(),
    fetchERPNextJobOfferTermTemplates(),
    fetchERPNextOfferTerms(),
    fetchERPNextCommentsForDocument("Job Offer", docName),
  ]);

  if (!offer?.name) notFound();

  const badge = workflowLabel(offer.docstatus);
  const designationOptions = toDesignationOptions(designations);
  const termsAndConditions = (termsRows ?? []).map((t) => ({
    name: t.name,
    title: t.title,
  }));
  const jobOfferTermTemplates = (templateRows ?? []).map((t) => ({
    name: t.name,
    title: t.name,
  }));
  const offerTermOptions = (offerTermRows ?? []).map((t) => ({
    name: t.name,
    title: t.name,
  }));
  const offerTermLines = (offer.offer_terms ?? []).filter(
    (row) => row.offer_term?.trim() || row.value?.trim(),
  );
  const defaultDesignation = offer.designation?.trim() ?? "";
  if (
    defaultDesignation &&
    !designationOptions.some((d) => d.name === defaultDesignation)
  ) {
    designationOptions.push({ name: defaultDesignation, label: defaultDesignation });
    designationOptions.sort((a, b) => a.label.localeCompare(b.label));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/staff/job-offers" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          ← Job offers
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Job offer</h1>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
          >
            {badge.label}
          </span>
          {offer.status ?
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
              {offer.status}
            </span>
          : null}
        </div>
        <p className="mt-1 font-mono text-xs text-slate-500">{offer.name}</p>
        {offer.job_applicant ?
          <p className="mt-2 text-sm text-slate-600">
            Applicant:{" "}
            <Link
              href={`/staff/applicants/${encodeURIComponent(offer.job_applicant)}`}
              className="font-medium text-[#0d4f6e] hover:underline"
            >
              {offer.applicant_name ?? offer.job_applicant}
            </Link>
          </p>
        : null}
      </div>

      {canApproveJobOffers ?
        <JobOfferHrPanel
          offer={{ ...offer, name: offer.name }}
          designations={designationOptions}
          offerTermOptions={offerTermOptions}
          jobOfferTermTemplates={jobOfferTermTemplates}
          termsAndConditions={termsAndConditions}
        />
      : <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Offer summary</h2>
          <p className="mt-1 text-sm text-slate-600">
            {offer.docstatus === 0 || offer.docstatus === undefined ?
              "This draft is waiting for HR to review, amend, submit, and send to the candidate."
            : offer.docstatus === 1 ?
              "HR has submitted this offer. Only HR can send it to the candidate."
            : "This offer is closed."}
          </p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Designation</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{offer.designation ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Offer date</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{offer.offer_date ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Company</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{offer.company ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{offer.applicant_email ?? "—"}</dd>
            </div>
          </dl>
          {offerTermLines.length > 0 ?
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-900">Job offer terms</h3>
              <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
                {offerTermLines.map((row, i) => (
                  <li key={row.name ?? i} className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr]">
                    <span className="text-sm font-medium text-slate-700">{row.offer_term}</span>
                    <span className="text-sm text-slate-600 whitespace-pre-wrap">{row.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          : null}
          {offer.terms?.trim() ?
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-900">Terms and conditions</h3>
              <div
                className="prose prose-sm mt-2 max-w-none text-slate-700"
                dangerouslySetInnerHTML={{ __html: offer.terms }}
              />
            </div>
          : null}
        </section>
      }

      <JobOfferCommentsSection
        offerDocName={offer.name}
        comments={offerComments ?? []}
      />
    </div>
  );
}
