"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  sendJobOfferEmailDemo,
  type JobOfferHrFormState,
} from "@/app/actions/job-offer";
import { IconMail, IconX } from "@/components/icons";
import {
  defaultFromEmailForCompany,
  defaultJobOfferEmailMessage,
  defaultJobOfferEmailSubject,
  JOB_OFFER_FROM_EMAIL_OPTIONS,
} from "@/lib/job-offer-email-demo";

type Props = {
  open: boolean;
  onClose: () => void;
  onSent?: (message: string) => void;
  docName: string;
  applicantName?: string | null;
  applicantEmail?: string | null;
  designation?: string | null;
  company?: string | null;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-[#0a1628]/40 focus:ring-2 focus:ring-[#0a1628]/15";
const labelClass = "text-sm font-medium text-slate-700";

export function JobOfferSendEmailModal({
  open,
  onClose,
  onSent,
  docName,
  applicantName,
  applicantEmail,
  designation,
  company,
}: Props) {
  const [state, formAction, pending] = useActionState(
    sendJobOfferEmailDemo,
    null as JobOfferHrFormState,
  );
  const handled = useRef<string | null>(null);

  const defaultFrom = defaultFromEmailForCompany(company);
  const defaultSubject = defaultJobOfferEmailSubject(docName);
  const defaultMessage = defaultJobOfferEmailMessage({
    applicantName,
    designation,
    company,
  });

  useEffect(() => {
    if (!state?.ok || state.ok === handled.current) return;
    handled.current = state.ok;
    onSent?.(state.ok);
    onClose();
  }, [state?.ok, onSent, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-offer-email-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative flex max-h-[min(90vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Send email</p>
            <h2 id="job-offer-email-title" className="truncate text-lg font-semibold text-slate-900">
              Job Offer: {docName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close"
          >
            <IconX />
          </button>
        </div>

        <form action={formAction} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <input type="hidden" name="docName" value={docName} />
          <div className="flex flex-col gap-4 px-5 py-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="offer-email-from" className={labelClass}>
                From
              </label>
              <select
                id="offer-email-from"
                name="fromEmail"
                required
                defaultValue={defaultFrom}
                className={inputClass}
              >
                {JOB_OFFER_FROM_EMAIL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="offer-email-to" className={labelClass}>
                To
              </label>
              <input
                id="offer-email-to"
                name="toEmail"
                type="email"
                required
                readOnly
                defaultValue={applicantEmail?.trim() ?? ""}
                className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-800"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="offer-email-subject" className={labelClass}>
                Subject <span className="text-red-600">*</span>
              </label>
              <input
                id="offer-email-subject"
                name="subject"
                type="text"
                required
                defaultValue={defaultSubject}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="offer-email-message" className={labelClass}>
                Message
              </label>
              <textarea
                id="offer-email-message"
                name="message"
                rows={10}
                required
                defaultValue={defaultMessage}
                className={`${inputClass} resize-y`}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="attachPrint"
                defaultChecked
                className="h-4 w-4 rounded border-slate-300"
              />
              Attach document print (demo)
            </label>

            <p className="text-xs text-slate-500">
              Demo mode: no email is sent. This preview matches the compose flow HR will use after
              approval.
            </p>

            {state?.error ?
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                {state.error}
              </p>
            : null}
          </div>

          <div className="mt-auto flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={pending || !applicantEmail?.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-60"
              title={!applicantEmail?.trim() ? "Applicant email is required" : undefined}
            >
              <IconMail className="h-4 w-4" />
              {pending ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
