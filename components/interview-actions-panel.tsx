"use client";

import { useActionState, useState } from "react";
import {
  submitInterviewForStaff,
  type InterviewFormState,
} from "@/app/actions/interview";
import { InterviewRescheduleDialog } from "@/components/interview-reschedule-dialog";

type Props = {
  docName: string;
  status?: string;
  docstatus?: number;
  scheduledOn?: string;
  fromTime?: string;
  toTime?: string;
};

const labelClass = "text-sm font-medium text-slate-700";

export function InterviewActionsPanel({
  docName,
  status,
  docstatus,
  scheduledOn,
  fromTime,
  toTime,
}: Props) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const isSubmitted = docstatus === 1;
  const isCancelled = docstatus === 2 || status === "Cancelled";
  const canReschedule = !isSubmitted && !isCancelled;
  const canSubmit = !isSubmitted && !isCancelled;

  const [submitState, submitAction, submitPending] = useActionState(
    submitInterviewForStaff,
    null as InterviewFormState,
  );

  if (!canReschedule && !canSubmit) {
    return (
      <p className="text-sm text-slate-600">
        {isSubmitted ?
          "This interview has been submitted. Update the applicant record in the recruitment system if needed."
        : "This interview is no longer active."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {canReschedule ?
        <>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setRescheduleOpen(true)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Reschedule
            </button>
            <p className="text-xs text-slate-500">
              Change the date or time for this interview.
            </p>
          </div>
          <InterviewRescheduleDialog
            open={rescheduleOpen}
            onClose={() => setRescheduleOpen(false)}
            docName={docName}
            scheduledOn={scheduledOn}
            fromTime={fromTime}
            toTime={toTime}
          />
        </>
      : null}

      {canReschedule && canSubmit ?
        <hr className="border-slate-200" />
      : null}

      {canSubmit ?
        <form action={submitAction} className="flex flex-col gap-4">
          <input type="hidden" name="docName" value={docName} />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Complete interview</h3>
            <p className="mt-1 text-xs text-slate-500">
              Choose an outcome and submit to close this interview. Add notes in the interview
              summary section below first if needed.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>
              Outcome <span className="text-red-600">*</span>
            </span>
            <div className="flex flex-wrap gap-4 text-sm text-slate-800">
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="status" value="Cleared" required defaultChecked />
                Cleared
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="status" value="Rejected" />
                Rejected
              </label>
            </div>
          </div>
          {submitState?.error ?
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {submitState.error}
            </p>
          : null}
          {submitState?.ok ?
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
              {submitState.ok}
            </p>
          : null}
          <button
            type="submit"
            disabled={submitPending}
            className="w-fit rounded-lg bg-[#0a1628] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#152a45] disabled:opacity-60"
          >
            {submitPending ? "Submitting…" : "Submit interview"}
          </button>
        </form>
      : null}
    </div>
  );
}
