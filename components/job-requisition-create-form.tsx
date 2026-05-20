"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createJobRequisition,
  type JobRequisitionFormState,
} from "@/app/actions/job-requisition";
import { DesignationCreateDialog } from "@/components/designation-create-dialog";
import { IconPlus } from "@/components/icons";
import type { OpeningFormOption } from "@/components/opening-form";
import { COMPANY_IDS, COMPANIES, type CompanyId } from "@/lib/companies";

const initial: JobRequisitionFormState = null;

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-[#0a1628]/40 focus:ring-2 focus:ring-[#0a1628]/15";
const selectClass = `${inputClass} appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10`;
const selectChevronStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
} as const;
const labelClass = "text-sm font-medium text-slate-700";

type Props = {
  defaultPostingDate: string;
  defaultCompanyId: CompanyId;
  designations: OpeningFormOption[];
  departments: OpeningFormOption[];
};

export function JobRequisitionCreateForm({
  defaultPostingDate,
  defaultCompanyId,
  designations,
  departments,
}: Props) {
  const [state, action, pending] = useActionState(createJobRequisition, initial);
  const [designationOptions, setDesignationOptions] = useState(designations);
  const [designation, setDesignation] = useState("");
  const [showDesignationDialog, setShowDesignationDialog] = useState(false);

  useEffect(() => {
    setDesignationOptions(designations);
  }, [designations]);

  const onDesignationCreated = (name: string) => {
    setDesignationOptions((prev) => {
      if (prev.some((d) => d.name === name)) return prev;
      return [...prev, { name, label: name }].sort((a, b) => a.label.localeCompare(b.label));
    });
    setDesignation(name);
  };

  return (
    <>
      <form
        action={action}
        className="flex max-w-xl flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="company" className={labelClass}>
              Company <span className="text-red-600">*</span>
            </label>
            <select
              id="company"
              name="company"
              required
              defaultValue={defaultCompanyId}
              className={selectClass}
              style={selectChevronStyle}
            >
              {COMPANY_IDS.map((id) => (
                <option key={id} value={id}>
                  {COMPANIES[id].label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="noOfPositions" className={labelClass}>
              No. of positions <span className="text-red-600">*</span>
            </label>
            <input
              id="noOfPositions"
              name="noOfPositions"
              type="number"
              min={1}
              required
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="expectedCompensation" className={labelClass}>
              Expected compensation <span className="text-red-600">*</span>
            </label>
            <input
              id="expectedCompensation"
              name="expectedCompensation"
              required
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <label htmlFor="designation" className={labelClass}>
                Designation <span className="text-red-600">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowDesignationDialog(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0d4f6e] hover:underline"
              >
                <IconPlus className="h-3.5 w-3.5" />
                New designation
              </button>
            </div>
            <select
              id="designation"
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
              {designationOptions.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.label}
                </option>
              ))}
            </select>
            {designationOptions.length === 0 ?
              <p className="text-xs text-amber-700">
                No designations found. Use <strong>New designation</strong> to add one first.
              </p>
            : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="department" className={labelClass}>
              Department
            </label>
            <select
              id="department"
              name="department"
              defaultValue=""
              className={selectClass}
              style={selectChevronStyle}
            >
              <option value="">— None —</option>
              {departments.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="postingDate" className={labelClass}>
              Posting date <span className="text-red-600">*</span>
            </label>
            <input
              id="postingDate"
              name="postingDate"
              type="date"
              required
              defaultValue={defaultPostingDate}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="expectedBy" className={labelClass}>
              Expected by
            </label>
            <input id="expectedBy" name="expectedBy" type="date" className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="description" className={labelClass}>
              Job description
            </label>
            <textarea id="description" name="description" rows={6} className={inputClass} />
          </div>
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

      <DesignationCreateDialog
        open={showDesignationDialog}
        onClose={() => setShowDesignationDialog(false)}
        onCreated={onDesignationCreated}
      />
    </>
  );
}
