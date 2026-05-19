"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  createJobOfferForStaff,
  type JobOfferCreateFormState,
} from "@/app/actions/job-offer";
import type { CompanyId } from "@/lib/companies";
import type { DesignationOption } from "@/lib/designation-options";
import { JobOfferTermsSection } from "@/components/job-offer-terms-section";
import type { JobOfferApplicationOption } from "@/lib/job-offer-application-options";

type LinkOption = { name: string; title?: string };

type Props = {
  mode: "prefilled" | "picker";
  companyId: CompanyId;
  companyLabel: string;
  designations: DesignationOption[];
  termsAndConditions: LinkOption[];
  jobOfferTermTemplates: LinkOption[];
  offerTermOptions: LinkOption[];
  defaultOfferDate: string;
  /** Prefilled mode */
  preselectedApplication?: JobOfferApplicationOption;
  /** Picker mode — all applications */
  applications?: JobOfferApplicationOption[];
  cancelHref?: string;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-[#0a1628]/40 focus:ring-2 focus:ring-[#0a1628]/15";
const selectClass = `${inputClass} appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10`;
const readOnlyClass =
  "w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-800";
const labelClass = "text-sm font-medium text-slate-700";
const selectChevronStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
} as const;

const STATUS_OPTIONS = [
  "Awaiting Response",
  "Accepted",
  "Rejected",
  "Cancelled",
] as const;

export function JobOfferCreateForm({
  mode,
  companyId,
  companyLabel,
  designations,
  termsAndConditions,
  jobOfferTermTemplates,
  offerTermOptions,
  defaultOfferDate,
  preselectedApplication,
  applications = [],
  cancelHref = "/staff/job-offers",
}: Props) {
  const [state, formAction, pending] = useActionState(
    createJobOfferForStaff,
    null as JobOfferCreateFormState,
  );

  const initialApp =
    mode === "prefilled" ? preselectedApplication
    : undefined;

  const [applicationName, setApplicationName] = useState(initialApp?.name ?? "");
  const [designation, setDesignation] = useState(initialApp?.designation ?? "");

  const selectedApplication = useMemo(() => {
    if (mode === "prefilled" && preselectedApplication) return preselectedApplication;
    return applications.find((a) => a.name === applicationName);
  }, [mode, preselectedApplication, applications, applicationName]);

  useEffect(() => {
    if (!selectedApplication) return;
    if (selectedApplication.designation) {
      setDesignation(selectedApplication.designation);
    }
  }, [selectedApplication]);

  const applicantName = selectedApplication?.applicantName ?? "";
  const applicantEmail = selectedApplication?.email ?? "";
  const canSubmit = Boolean(selectedApplication?.name && designation);

  return (
    <form action={formAction} className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
      <input type="hidden" name="company" value={companyId} />
      <input type="hidden" name="applicantDocName" value={selectedApplication?.name ?? ""} />
      <input type="hidden" name="applicantName" value={applicantName} />
      <input type="hidden" name="applicantEmail" value={applicantEmail} />

      <div className="flex w-full flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Job offer details</h2>
          <p className="mt-1 text-sm text-slate-600">
            Complete the offer fields and save as a draft. HR will review, submit, and send it to the
            candidate.
          </p>
        </div>

        {mode === "picker" ?
          <div className="flex flex-col gap-1.5">
            <label htmlFor="application" className={labelClass}>
              Select application <span className="text-red-600">*</span>
            </label>
            <select
              id="application"
              required
              value={applicationName}
              onChange={(e) => setApplicationName(e.target.value)}
              className={selectClass}
              style={selectChevronStyle}
            >
              <option value="" disabled>
                Select application…
              </option>
              {applications.map((a) => (
                <option key={a.name} value={a.name}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        : <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Select application</span>
            <p className={readOnlyClass}>{selectedApplication?.label ?? "—"}</p>
          </div>
        }

        {selectedApplication ?
          <>
            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Applicant name</span>
              <p className={readOnlyClass}>{applicantName || "—"}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Applicant email address</span>
              <p className={readOnlyClass}>{applicantEmail || "—"}</p>
            </div>

            {selectedApplication.jobOpeningLabel ?
              <div className="flex flex-col gap-1.5">
                <span className={labelClass}>Job opening</span>
                <p className={readOnlyClass}>{selectedApplication.jobOpeningLabel}</p>
              </div>
            : null}
          </>
        : null}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="offer-status" className={labelClass}>
            Status
          </label>
          <select
            id="offer-status"
            name="status"
            defaultValue="Awaiting Response"
            className={selectClass}
            style={selectChevronStyle}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="offer-date" className={labelClass}>
            Offer date <span className="text-red-600">*</span>
          </label>
          <input
            id="offer-date"
            name="offerDate"
            type="date"
            required
            defaultValue={defaultOfferDate}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="offer-designation" className={labelClass}>
            Designation <span className="text-red-600">*</span>
          </label>
          <select
            id="offer-designation"
            name="designation"
            required
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
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
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>Company</span>
          <p className={readOnlyClass}>{companyLabel}</p>
        </div>

        <JobOfferTermsSection
          offerTermOptions={offerTermOptions}
          jobOfferTermTemplates={jobOfferTermTemplates}
          termsAndConditions={termsAndConditions}
          idPrefix="create"
        />

        {state?.error ?
          <p
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100"
            role="alert"
          >
            {state.error}
          </p>
        : null}

        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-2">
          <button
            type="submit"
            disabled={pending || !canSubmit}
            className="rounded-lg bg-[#0a1628] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152a45] disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save as draft"}
          </button>
          <Link
            href={cancelHref}
            className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}
