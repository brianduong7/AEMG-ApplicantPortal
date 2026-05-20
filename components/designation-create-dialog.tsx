"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  createDesignationForRecruiter,
  type RecruiterFormState,
} from "@/app/actions/recruiter";
import { IconPlus, IconX } from "@/components/icons";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (designationName: string) => void;
};

export function DesignationCreateDialog({ open, onClose, onCreated }: Props) {
  const [state, formAction, pending] = useActionState(
    createDesignationForRecruiter,
    null as RecruiterFormState,
  );
  const [, startTransition] = useTransition();
  const [clientError, setClientError] = useState<string | null>(null);
  const handled = useRef<string | null>(null);
  const formKey = open ? "designation-dialog-open" : "designation-dialog-closed";

  useEffect(() => {
    if (!open) {
      handled.current = null;
      setClientError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!state?.ok || state.ok === handled.current) return;
    handled.current = state.ok;
    onCreated(state.ok);
    onClose();
  }, [state?.ok, onCreated, onClose]);

  if (!open) return null;

  const displayError = clientError ?? state?.error;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="designation-dialog-title"
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
            <h2 id="designation-dialog-title" className="text-lg font-semibold text-slate-900">
              New designation
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Add a title and optional description. Skills and appraisal templates are not required.
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

        <form
          key={formKey}
          className="mt-5 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setClientError(null);
            const form = e.currentTarget;
            const title = String(new FormData(form).get("designationTitle") ?? "").trim();
            if (!title) {
              setClientError("Designation title is required.");
              return;
            }
            startTransition(() => {
              formAction(new FormData(form));
            });
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="designationTitle" className="text-sm font-medium text-slate-700">
              Designation title <span className="text-red-600">*</span>
            </label>
            <input
              id="designationTitle"
              name="designationTitle"
              required
              autoFocus
              className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-[#0a1628]/40 focus:ring-2 focus:ring-[#0a1628]/15"
              placeholder="e.g. Marketing Manager"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="designationDescription" className="text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="designationDescription"
              name="designationDescription"
              rows={4}
              className="resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-[#0a1628]/40 focus:ring-2 focus:ring-[#0a1628]/15"
              placeholder="Optional summary of this role"
            />
          </div>
          {displayError ?
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {displayError}
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
              className="inline-flex items-center gap-2 rounded-lg bg-[#0a1628] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#152a45] disabled:opacity-60"
            >
              <IconPlus className="h-4 w-4" />
              {pending ? "Creating…" : "Create designation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
