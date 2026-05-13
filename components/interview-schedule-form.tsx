"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  scheduleInterviewForRecruiter,
  type RecruiterFormState,
} from "@/app/actions/recruiter";

type InterviewTypeOption = { name: string };

type Props = {
  applicantName: string;
  interviewTypes: InterviewTypeOption[];
  defaultInterviewType?: string;
};

export function InterviewScheduleForm({
  applicantName,
  interviewTypes,
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

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="applicantName" value={applicantName} />
      <h2 className="text-base font-semibold text-slate-900">Schedule interview</h2>
      <p className="text-sm text-slate-600">
        Creates an{" "}
        <code className="rounded bg-slate-100 px-1 text-xs">Interview</code> document in
        ERPNext (HRMS).
      </p>
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
        <div className="flex flex-col gap-1.5">
          <label htmlFor="interviewType" className="text-sm font-medium text-slate-700">
            Interview type
          </label>
          <select
            id="interviewType"
            name="interviewType"
            defaultValue={defaultInterviewType ?? interviewTypes[0]?.name ?? ""}
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm"
          >
            <option value="">Use default (env)</option>
            {interviewTypes.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
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
          Interviewer (User id)
        </label>
        <input
          id="interviewerUser"
          name="interviewerUser"
          type="text"
          className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm"
          placeholder="Optional — e.g. user email as in ERPNext User"
        />
      </div>
      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900 ring-1 ring-emerald-100" role="status">
          {state.ok}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? "Scheduling…" : "Schedule interview"}
      </button>
    </form>
  );
}
