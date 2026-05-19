"use client";

import { useActionState } from "react";
import {
  updateInterviewSummaryForStaff,
  type InterviewFormState,
} from "@/app/actions/interview";

type Props = {
  docName: string;
  initialSummary: string;
};

export function InterviewSummaryForm({ docName, initialSummary }: Props) {
  const [state, formAction, pending] = useActionState(
    updateInterviewSummaryForStaff,
    null as InterviewFormState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="docName" value={docName} />
      <label htmlFor="interviewSummary" className="text-sm font-medium text-slate-700">
        Interview summary
      </label>
      <p className="text-xs text-slate-500">
        Recruiter notes after the interview (Teams meetings happen outside this app).
      </p>
      <textarea
        id="interviewSummary"
        name="interviewSummary"
        rows={8}
        defaultValue={initialSummary}
        className="min-h-[10rem] max-h-[28rem] resize-y overflow-y-auto rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-[#0a1628]/40 focus:ring-2 focus:ring-[#0a1628]/15"
        placeholder="Outcome, feedback, next steps…"
      />
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
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-[#0a1628] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#152a45] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save summary"}
      </button>
    </form>
  );
}
