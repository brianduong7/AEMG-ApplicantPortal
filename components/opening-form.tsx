"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  createOpeningForRecruiter,
  updateOpeningForRecruiter,
  type RecruiterFormState,
} from "@/app/actions/recruiter";
import { DesignationCreateDialog } from "@/components/designation-create-dialog";
import { IconPlus } from "@/components/icons";
import { OpeningQuestionPicker } from "@/components/opening-question-picker";
import {
  normalizeJobDescriptionForEditor,
  prepareJobDescriptionForDisplay,
} from "@/lib/job-description-html";
import { JOB_DESCRIPTION_PREVIEW_HTML_CLASS } from "@/lib/job-description-preview-classes";
import type { RecruitmentQuestion } from "@/lib/recruitment-questions-demo";

type Initial = {
  jobTitle: string;
  designation: string;
  department: string;
  employmentType: string;
  location: string;
  description: string;
  status: "Open" | "Closed";
  publish: boolean;
  jobRequisition?: string;
};

export type OpeningFormOption = {
  name: string;
  label: string;
};

type SharedProps = {
  designations: OpeningFormOption[];
  employmentTypes: string[];
  defaultQuestions: RecruitmentQuestion[];
  optionalQuestions: RecruitmentQuestion[];
  initialAdditionalQuestionIds?: string[];
};

type Props =
  | ({
      mode: "create";
      docName?: undefined;
      initial?: Partial<Initial>;
      jobRequisitionOptions?: OpeningFormOption[];
      lockedJobRequisition?: string;
    } & SharedProps)
  | ({ mode: "edit"; docName: string; initial: Initial; jobRequisitionOptions?: OpeningFormOption[] } & SharedProps);

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-[#0a1628]/40 focus:ring-2 focus:ring-[#0a1628]/15";
const selectClass = `${inputClass} appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10`;
const selectChevronStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
} as const;
const labelClass = "text-sm font-medium text-slate-700";

export function OpeningForm(props: Props) {
  const action = props.mode === "create" ? createOpeningForRecruiter : updateOpeningForRecruiter;
  const [state, formAction, pending] = useActionState(action, null as RecruiterFormState);

  const emptyInitial: Initial = {
    jobTitle: "",
    designation: "",
    department: "",
    employmentType: "",
    location: "",
    description: "",
    status: "Open",
    publish: true,
    jobRequisition: "",
  };

  const init: Initial =
    props.mode === "edit" ?
      props.initial
    : { ...emptyInitial, ...props.initial };

  const lockedRequisition =
    props.mode === "create" ? props.lockedJobRequisition?.trim() : undefined;
  const requisitionOptions =
    props.jobRequisitionOptions?.filter((o) => o.name.trim()) ?? [];

  const [designationOptions, setDesignationOptions] = useState(props.designations);
  const [designation, setDesignation] = useState(init.designation);
  const [showDesignationDialog, setShowDesignationDialog] = useState(false);

  useEffect(() => {
    setDesignationOptions(props.designations);
  }, [props.designations]);
  const [description, setDescription] = useState(() =>
    normalizeJobDescriptionForEditor(init.description),
  );
  const [descriptionView, setDescriptionView] = useState<"write" | "preview">("write");

  const employmentOptions = useMemo(
    () => props.employmentTypes.filter(Boolean).sort((a, b) => a.localeCompare(b)),
    [props.employmentTypes],
  );

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
        action={formAction}
        className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8"
      >
        {props.mode === "edit" ?
          <input type="hidden" name="docName" value={props.docName} />
        : null}

        <div className="flex w-full flex-col gap-6">
          {requisitionOptions.length > 0 || lockedRequisition ?
            <div className="flex flex-col gap-1.5">
              <label htmlFor="jobRequisition" className={labelClass}>
                Job requisition
              </label>
              {lockedRequisition ?
                <>
                  <input type="hidden" name="jobRequisition" value={lockedRequisition} />
                  <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800">
                    {lockedRequisition}
                  </p>
                  <p className="text-xs text-slate-500">
                    Fields below were prefilled from this approved requisition.
                  </p>
                </>
              : <select
                  id="jobRequisition"
                  name="jobRequisition"
                  defaultValue={init.jobRequisition ?? ""}
                  className={selectClass}
                  style={selectChevronStyle}
                >
                  <option value="">— None —</option>
                  {requisitionOptions.map((r) => (
                    <option key={r.name} value={r.name}>
                      {r.label}
                    </option>
                  ))}
                </select>
              }
            </div>
          : null}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="jobTitle" className={labelClass}>
              Job title <span className="text-red-600">*</span>
            </label>
            <input
              id="jobTitle"
              name="jobTitle"
              required
              defaultValue={init.jobTitle}
              className={inputClass}
              placeholder="e.g. Senior Marketing Manager"
            />
            <p className="text-xs text-slate-500">Headline shown to candidates on the careers site.</p>
          </div>

          <div className="flex flex-col gap-1.5">
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
            <input
              id="department"
              name="department"
              defaultValue={init.department}
              className={inputClass}
              placeholder="e.g. Marketing"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="employmentType" className={labelClass}>
              Employment type
            </label>
            <select
              id="employmentType"
              name="employmentType"
              defaultValue={init.employmentType}
              className={selectClass}
              style={selectChevronStyle}
            >
              <option value="">— Not set —</option>
              {employmentOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="location" className={labelClass}>
              Location
            </label>
            <input
              id="location"
              name="location"
              defaultValue={init.location}
              className={inputClass}
              placeholder="Office or branch (optional)"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="description" className={labelClass}>
                Description
              </label>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setDescriptionView("write")}
                  className={`rounded-md px-3 py-1.5 transition ${
                    descriptionView === "write" ?
                      "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setDescriptionView("preview")}
                  className={`rounded-md px-3 py-1.5 transition ${
                    descriptionView === "preview" ?
                      "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Use HTML for headings and lists. Switch to Preview to see how it will appear to
              candidates.
            </p>
            {descriptionView === "write" ?
              <textarea
                id="description"
                name="description"
                rows={12}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                spellCheck={false}
                className="min-h-[16rem] w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 font-mono text-sm text-slate-900 shadow-sm outline-none focus:border-[#0a1628]/40 focus:ring-2 focus:ring-[#0a1628]/15"
              />
            : <div className="min-h-[16rem] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                {description.trim() ?
                  <div
                    className={JOB_DESCRIPTION_PREVIEW_HTML_CLASS}
                    dangerouslySetInnerHTML={{
                      __html:
                        prepareJobDescriptionForDisplay(description).html ?? description,
                    }}
                  />
                : <p className="text-sm italic text-slate-500">No description yet.</p>}
              </div>
            }
          </div>

          {props.mode === "edit" ?
            <div className="flex flex-col gap-1.5">
              <label htmlFor="status" className={labelClass}>
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={init.status}
                className={selectClass}
                style={selectChevronStyle}
              >
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          : <input type="hidden" name="status" value="Open" />}

          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Visibility</span>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="publish"
                defaultChecked={init.publish}
                className="h-4 w-4 rounded border-slate-300 text-[#0a1628] focus:ring-[#0a1628]/25"
              />
              Publish on website
            </label>
          </div>

          <OpeningQuestionPicker
            defaultQuestions={props.defaultQuestions}
            optionalQuestions={props.optionalQuestions}
            initialAdditionalQuestionIds={props.initialAdditionalQuestionIds}
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
              disabled={pending}
              className="rounded-lg bg-[#0a1628] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152a45] disabled:opacity-60"
            >
              {pending ?
                "Saving…"
              : props.mode === "create" ?
                "Create opening"
              : "Save changes"}
            </button>
          </div>
        </div>
      </form>

      <DesignationCreateDialog
        open={showDesignationDialog}
        onClose={() => setShowDesignationDialog(false)}
        onCreated={onDesignationCreated}
      />
    </>
  );
}
