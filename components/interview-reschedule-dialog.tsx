"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import {
  rescheduleInterviewForStaff,
  type InterviewFormState,
} from "@/app/actions/interview";
import { erpTimeToInputValue } from "@/lib/erp-time";
import { IconX } from "@/components/icons";

type Props = {
  open: boolean;
  onClose: () => void;
  docName: string;
  scheduledOn?: string;
  fromTime?: string;
  toTime?: string;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-[#0a1628]/40 focus:ring-2 focus:ring-[#0a1628]/15";
const labelClass = "text-sm font-medium text-slate-700";

function erpDateToInputValue(raw?: string): string {
  const d = raw?.trim();
  if (!d) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const m = d.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return d;
}

export function InterviewRescheduleDialog({
  open,
  onClose,
  docName,
  scheduledOn,
  fromTime,
  toTime,
}: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    rescheduleInterviewForStaff,
    null as InterviewFormState,
  );
  const handled = useRef<string | null>(null);
  const formKey = open ? "reschedule-open" : "reschedule-closed";

  useEffect(() => {
    if (!open) handled.current = null;
  }, [open]);

  useEffect(() => {
    if (!state?.ok || state.ok === handled.current) return;
    handled.current = state.ok;
    onClose();
    router.refresh();
  }, [state?.ok, onClose, router]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-dialog-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="reschedule-dialog-title" className="text-lg font-semibold text-slate-900">
              Reschedule interview
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Pick a new date and time. Times use 24-hour format (e.g. 10:00–11:00).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close"
          >
            <IconX />
          </button>
        </div>

        <form key={formKey} action={formAction} className="mt-5 flex flex-col gap-4">
          <input type="hidden" name="docName" value={docName} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rescheduleDate" className={labelClass}>
              Date <span className="text-red-600">*</span>
            </label>
            <input
              id="rescheduleDate"
              name="scheduledOn"
              type="date"
              required
              defaultValue={erpDateToInputValue(scheduledOn)}
              className={inputClass}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rescheduleFrom" className={labelClass}>
                From <span className="text-red-600">*</span>
              </label>
              <input
                id="rescheduleFrom"
                name="fromTime"
                type="time"
                required
                step={60}
                defaultValue={erpTimeToInputValue(fromTime) || "10:00"}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rescheduleTo" className={labelClass}>
                To <span className="text-red-600">*</span>
              </label>
              <input
                id="rescheduleTo"
                name="toTime"
                type="time"
                required
                step={60}
                defaultValue={erpTimeToInputValue(toTime) || "11:00"}
                className={inputClass}
              />
            </div>
          </div>
          {state?.error ?
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {state.error}
            </p>
          : null}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-[#0a1628] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#152a45] disabled:opacity-60"
            >
              {pending ? "Rescheduling…" : "Reschedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
