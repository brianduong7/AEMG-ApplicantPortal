"use client";

import { useActionState } from "react";
import {
  createJobRequisition,
  type JobRequisitionFormState,
} from "@/app/actions/job-requisition";

const initial: JobRequisitionFormState = null;

type Props = {
  defaultPostingDate: string;
  defaultNamingSeries?: string;
};

export function JobRequisitionCreateForm({
  defaultPostingDate,
  defaultNamingSeries = "HR-HIREQ-",
}: Props) {
  const [state, action, pending] = useActionState(createJobRequisition, initial);

  return (
    <form action={action} className="flex max-w-xl flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-slate-700">Naming series</span>
          <input
            name="namingSeries"
            defaultValue={defaultNamingSeries}
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">
            No. of positions <span className="text-red-600">*</span>
          </span>
          <input
            name="noOfPositions"
            type="number"
            min={1}
            required
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">
            Expected compensation <span className="text-red-600">*</span>
          </span>
          <input
            name="expectedCompensation"
            required
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-slate-700">
            Designation <span className="text-red-600">*</span>
          </span>
          <input
            name="designation"
            required
            placeholder="Link name in the system (e.g. Software Engineer)"
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Department</span>
          <input
            name="department"
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">
            Posting date <span className="text-red-600">*</span>
          </span>
          <input
            name="postingDate"
            type="date"
            required
            defaultValue={defaultPostingDate}
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-slate-700">Expected by</span>
          <input
            name="expectedBy"
            type="date"
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-slate-700">Job description</span>
          <textarea
            name="description"
            rows={6}
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
          />
        </label>
      </div>

      {state?.error ?
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      : null}
      {state?.ok ?
        <p className="text-sm text-emerald-800" role="status">
          {state.ok}
        </p>
      : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-fit items-center justify-center rounded-lg bg-[#E8961E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#d48618] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Create requisition"}
      </button>
    </form>
  );
}
