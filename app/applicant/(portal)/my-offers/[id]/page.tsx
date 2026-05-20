import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ApplicantJobOfferDetailSections } from "@/components/applicant-job-offer-detail";
import { ApplicantOfferResponse } from "@/components/applicant-offer-response";
import { getApplicantCandidateStrict } from "@/lib/applicant-candidate";
import {
  fetchApplicantJobOfferDetailForCandidate,
  JOB_OFFER_ERP_STATUS_ACCEPTED,
  JOB_OFFER_ERP_STATUS_REJECTED,
  jobOfferStatusDisplayLabel,
} from "@/lib/applications";
import { hasERPNextConfig } from "@/lib/erpnext";
import { getPortalTheme } from "@/lib/portal-theme";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Offer details — Applicant Portal",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ApplicantMyOfferDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/applicant/login?intent=applicant");

  const { id } = await params;
  const offerId = decodeURIComponent(id).trim();
  if (!offerId) notFound();

  const t = getPortalTheme(session.company);
  const isAemg = session.company === "aemg";
  const accentButton = isAemg ? "bg-[#00AEEF] hover:bg-[#0096d1]" : "bg-[#0a1628] hover:bg-[#152a45]";
  const accentOutline =
    isAemg ?
      "border-[#00AEEF]/40 text-[#0096d1] hover:bg-sky-50"
    : "border-slate-300 text-[#0d4f6e] hover:bg-slate-50";
  const accentText = isAemg ? "text-[#0096d1]" : "text-[#0d4f6e]";

  if (!hasERPNextConfig()) {
    return (
      <div>
        <h1 className={t.pageTitle}>Job offer</h1>
        <p className={t.pageSubtitle}>Recruitment backend is not configured.</p>
      </div>
    );
  }

  const candidate = await getApplicantCandidateStrict();
  if (!candidate?.name) notFound();

  const offer = await fetchApplicantJobOfferDetailForCandidate(offerId, candidate.name);
  if (!offer?.id) notFound();

  const statusLabel = jobOfferStatusDisplayLabel(offer.status);

  const offerForResponse = {
    id: offer.id,
    status: offer.status,
    designation: offer.designation,
    offerDate: offer.offerDate,
    company: offer.company,
    docstatus: offer.docstatus,
    canRespond: offer.canRespond,
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/applicant/my-offers" className={t.backLink}>
          ← My Offer
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className={t.pageTitle}>{offer.designation}</h1>
          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
            {statusLabel}
          </span>
        </div>
        <p className={t.pageSubtitle}>
          {offer.applicationJobTitle} · {offer.company}
        </p>
      </div>

      <ApplicantJobOfferDetailSections
        offer={offer}
        applicationLinkClass={`font-medium ${accentText} hover:underline`}
      />

      <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Your response
        </h2>
        {offer.canRespond ?
          <ApplicantOfferResponse
            offer={offerForResponse}
            accentButtonClass={accentButton}
            accentOutlineClass={accentOutline}
          />
        : offer.status === JOB_OFFER_ERP_STATUS_ACCEPTED ?
          <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            You accepted this offer.
          </p>
        : offer.status === JOB_OFFER_ERP_STATUS_REJECTED ?
          <p className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
            You declined this offer. Your application status is{" "}
            <strong>Offer Declined</strong>.
          </p>
        : <p className="mt-4 text-sm text-slate-600">
            This offer is not open for a response right now.
          </p>
        }
      </section>
    </div>
  );
}
