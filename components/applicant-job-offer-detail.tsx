import Link from "next/link";
import {
  jobOfferStatusDisplayLabel,
  type ApplicantJobOfferDetail,
} from "@/lib/applications";
import { JOB_DESCRIPTION_PREVIEW_HTML_CLASS } from "@/lib/job-description-preview-classes";

type Props = {
  offer: ApplicantJobOfferDetail;
  applicationLinkClass?: string;
};

function TermsAndConditions({ html }: { html: string }) {
  const trimmed = html.trim();
  if (!trimmed) return null;
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return (
      <div
        className={JOB_DESCRIPTION_PREVIEW_HTML_CLASS}
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    );
  }
  return <p className="whitespace-pre-wrap text-sm text-slate-700">{trimmed}</p>;
}

export function ApplicantJobOfferDetailSections({
  offer,
  applicationLinkClass = "font-medium text-[#0d4f6e] hover:underline",
}: Props) {
  const statusLabel = jobOfferStatusDisplayLabel(offer.status);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Your details
        </h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Applicant name</dt>
            <dd className="font-medium text-slate-900">{offer.applicantName}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Email address</dt>
            <dd className="text-slate-800">{offer.applicantEmail}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-slate-500">Application</dt>
            <dd className="text-slate-800">
              {offer.jobApplicantId ?
                <Link
                  href={`/applicant/applications/${encodeURIComponent(offer.jobApplicantId)}`}
                  className={applicationLinkClass}
                >
                  {offer.applicationJobTitle}
                </Link>
              : offer.applicationJobTitle}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Offer summary
        </h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Offer reference</dt>
            <dd className="font-mono text-xs text-slate-800">{offer.id}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd>
              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                {statusLabel}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Designation</dt>
            <dd className="font-medium text-slate-900">{offer.designation}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Offer date</dt>
            <dd className="text-slate-800">{offer.offerDate}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Company</dt>
            <dd className="text-slate-800">{offer.company}</dd>
          </div>
        </dl>
      </section>

      {offer.offerTerms.length > 0 ?
        <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Job offer terms
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Benefits and conditions included in this offer.
          </p>
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Offer term
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {offer.offerTerms.map((row, i) => (
                  <tr key={`${row.offerTerm}-${i}`}>
                    <td className="px-4 py-3 align-top font-medium text-slate-900">
                      {row.offerTerm || "—"}
                    </td>
                    <td className="px-4 py-3 align-top whitespace-pre-wrap text-slate-700">
                      {row.value || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      : null}

      {offer.termsHtml ?
        <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Terms and conditions
          </h2>
          <div className="mt-4">
            <TermsAndConditions html={offer.termsHtml} />
          </div>
        </section>
      : null}
    </div>
  );
}
