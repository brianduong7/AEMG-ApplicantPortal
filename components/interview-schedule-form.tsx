"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  scheduleInterviewForRecruiter,
  type RecruiterFormState,
} from "@/app/actions/recruiter";

type LinkOption = { name: string };

type Props = {
  applicantName: string;
  embedded?: boolean;
  interviewLinkMode?: "round" | "type";
  interviewRounds?: LinkOption[];
  interviewTypes?: LinkOption[];
  defaultInterviewRound?: string;
  defaultInterviewType?: string;
};

export function InterviewScheduleForm({
  applicantName,
  embedded = false,
  interviewLinkMode = "type",
  interviewRounds = [],
  interviewTypes = [],
  defaultInterviewRound,
  defaultInterviewType,
}: Props) {
  const [state, formAction, pending] = useActionState(
    scheduleInterviewForRecruiter,
    null as RecruiterFormState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
    }
  }, [state?.ok]);

  const useRound = interviewLinkMode === "round";
  const roundDefault = defaultInterviewRound ?? interviewRounds[0]?.name ?? "";
  const typeDefault = defaultInterviewType ?? interviewTypes[0]?.name ?? "";

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="applicantName" value={applicantName} />
      {embedded ? null : (
        <>
          <h2 className="text-base font-semibold text-slate-900">Schedule interview</h2>
          <p className="text-sm text-slate-600">
            Books an interview for this applicant in the recruitment system.
          </p>
        </>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="scheduledOn" className="text-sm font-medium text-slate-700">
            Date <span className="text-red-600">*</span>
          </label>
          <input
            id="scheduledOn"
            name="scheduledOn"
            type="date"
            required
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm"
          />
        </div>
        {useRound ?
          <div className="flex flex-col gap-1.5">
            <label htmlFor="interviewRound" className="text-sm font-medium text-slate-700">
              Interview round <span className="text-red-600">*</span>
            </label>
            <select
              id="interviewRound"
              name="interviewRound"
              defaultValue={roundDefault}
              required={!typeDefault}
              className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm"
            >
              <option value="" disabled>
                Select round…
              </option>
              {interviewRounds.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        : <div className="flex flex-col gap-1.5">
            <label htmlFor="interviewType" className="text-sm font-medium text-slate-700">
              Interview type
            </label>
            <select
              id="interviewType"
              name="interviewType"
              defaultValue={typeDefault}
              className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm"
            >
              <option value="">Use default</option>
              {interviewTypes.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        }
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fromTime" className="text-sm font-medium text-slate-700">
            From <span className="text-red-600">*</span>
          </label>
          <input
            id="fromTime"
            name="fromTime"
            type="time"
            required
            defaultValue="10:00"
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="toTime" className="text-sm font-medium text-slate-700">
            To <span className="text-red-600">*</span>
          </label>
          <input
            id="toTime"
            name="toTime"
            type="time"
            required
            defaultValue="11:00"
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="interviewerUser" className="text-sm font-medium text-slate-700">
          Interviewer (optional)
        </label>
        <input
          id="interviewerUser"
          name="interviewerUser"
          type="text"
          className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm"
          placeholder="Interviewer email or user id"
        />
      </div>
      {state?.error ?
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100" role="alert">
          {state.error}
        </p>
      : null}
      {state?.ok ?
        <p
          className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900 ring-1 ring-emerald-100"
          role="status"
        >
          {state.ok}
        </p>
      : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-[#0a1628] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152a45] disabled:opacity-60"
      >
        {pending ? "Scheduling…" : "Schedule interview"}
      </button>
    </form>
  );
}
