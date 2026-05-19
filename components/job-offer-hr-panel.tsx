"use client";

import { useActionState } from "react";
import { jobOfferHrAction, type JobOfferHrFormState } from "@/app/actions/job-offer";
import { JobOfferTermsSection } from "@/components/job-offer-terms-section";
import type { DesignationOption } from "@/lib/designation-options";
import type { ERPNextJobOfferDetail } from "@/lib/erpnext";
import type { JobOfferTermLine } from "@/lib/job-offer-terms";

type LinkOption = { name: string; title?: string };

type Props = {
  offer: ERPNextJobOfferDetail & { name: string };
  designations: DesignationOption[];
  offerTermOptions: LinkOption[];
  jobOfferTermTemplates: LinkOption[];
  termsAndConditions: LinkOption[];
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none focus:border-[#0a1628]/40 focus:ring-2 focus:ring-[#0a1628]/15";
const selectClass = `${inputClass} appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10`;
const readOnlyClass =
  "w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-800";
const labelClass = "text-sm font-medium text-slate-700";
const selectChevronStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
} as const;

export function JobOfferHrPanel({
  offer,
  designations,
  offerTermOptions,
  jobOfferTermTemplates,
  termsAndConditions,
}: Props) {
  const [state, formAction, pending] = useActionState(jobOfferHrAction, null as JobOfferHrFormState);

  const isDraft = offer.docstatus === 0 || offer.docstatus === undefined;
  const isSubmitted = offer.docstatus === 1;
  const defaultDesignation = offer.designation?.trim() ?? "";
  const initialRows: JobOfferTermLine[] = (offer.offer_terms ?? [])
    .map((row) => ({
      offer_term: row.offer_term?.trim() ?? "",
      value: row.value?.trim() ?? "",
    }))
    .filter((row) => row.offer_term || row.value);

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">HR review</h2>
        <p className="mt-1 text-sm text-slate-600">
          {isDraft ?
            "Amend the draft, then submit to approve. After submission, send the offer to the candidate."
          : isSubmitted ?
            "This offer is submitted. Send it to the candidate when ready."
          : "This offer is no longer editable."}
        </p>
      </div>

      <form action={formAction} className="flex w-full flex-col gap-6">
        <input type="hidden" name="docName" value={offer.name} />

        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>Job applicant</span>
          <p className={readOnlyClass}>{offer.job_applicant ?? "—"}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>Applicant name</span>
          <p className={readOnlyClass}>{offer.applicant_name ?? "—"}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>Applicant email</span>
          <p className={readOnlyClass}>{offer.applicant_email ?? "—"}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>Company</span>
          <p className={readOnlyClass}>{offer.company ?? "—"}</p>
        </div>

        {isDraft ?
          <>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="hr-designation" className={labelClass}>
                Designation <span className="text-red-600">*</span>
              </label>
              <select
                id="hr-designation"
                name="designation"
                required
                defaultValue={defaultDesignation}
                className={selectClass}
                style={selectChevronStyle}
              >
                <option value="" disabled>
                  Select designation…
                </option>
                {designations.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.label}
                  </option>
                ))}
                {defaultDesignation &&
                !designations.some((d) => d.name === defaultDesignation) ?
                  <option value={defaultDesignation}>{defaultDesignation}</option>
                : null}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="hr-offer-date" className={labelClass}>
                Offer date <span className="text-red-600">*</span>
              </label>
              <input
                id="hr-offer-date"
                name="offerDate"
                type="date"
                required
                defaultValue={offer.offer_date ?? ""}
                className={inputClass}
              />
            </div>

            <JobOfferTermsSection
                key={offer.name}
                offerTermOptions={offerTermOptions}
                jobOfferTermTemplates={jobOfferTermTemplates}
                termsAndConditions={termsAndConditions}
                initialTemplate={offer.job_offer_term_template ?? ""}
                initialSelectTerms={offer.select_terms ?? ""}
                initialTerms={offer.terms ?? ""}
                initialRows={initialRows}
                idPrefix="hr"
              />
          </>
        : <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Designation</span>
              <p className={readOnlyClass}>{offer.designation ?? "—"}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Offer date</span>
              <p className={readOnlyClass}>{offer.offer_date ?? "—"}</p>
            </div>
          </div>
        }

        {state?.error ?
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {state.error}
          </p>
        : null}
        {state?.ok ?
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
            {state.ok}
          </p>
        : null}

        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-2">
          {isDraft ?
            <>
              <button
                type="submit"
                name="intent"
                value="save"
                disabled={pending}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save changes"}
              </button>
              <button
                type="submit"
                name="intent"
                value="submit"
                disabled={pending}
                className="rounded-lg bg-[#0a1628] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#152a45] disabled:opacity-60"
              >
                {pending ? "Submitting…" : "Submit & approve"}
              </button>
            </>
          : null}
          {isSubmitted ?
            <button
              type="submit"
              name="intent"
              value="send"
              disabled={pending || !offer.applicant_email?.trim()}
              className="rounded-lg bg-[#0d4f6e] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0c3d56] disabled:opacity-60"
              title={
                !offer.applicant_email?.trim() ?
                  "Add an applicant email on the job offer first"
                : undefined
              }
            >
              {pending ? "Sending…" : "Send to candidate"}
            </button>
          : null}
        </div>
      </form>
    </section>
  );
}
