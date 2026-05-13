"use client";

import { useActionState, useState } from "react";
import {
  createOpeningForRecruiter,
  updateOpeningForRecruiter,
  type RecruiterFormState,
} from "@/app/actions/recruiter";
import { normalizeJobDescriptionForEditor } from "@/lib/job-description-html";
import { JOB_DESCRIPTION_PREVIEW_HTML_CLASS } from "@/lib/job-description-preview-classes";

type Initial = {
  jobTitle: string;
  designation: string;
  department: string;
  employmentType: string;
  location: string;
  description: string;
  status: "Open" | "Closed";
  publish: boolean;
};

type Props =
  | { mode: "create"; docName?: undefined; initial?: undefined }
  | { mode: "edit"; docName: string; initial: Initial };

export function OpeningForm(props: Props) {
  const action = props.mode === "create" ? createOpeningForRecruiter : updateOpeningForRecruiter;
  const [state, formAction, pending] = useActionState(action, null as RecruiterFormState);

  const init: Initial =
    props.mode === "edit" ?
      props.initial
    : {
        jobTitle: "",
        designation: "",
        department: "",
        employmentType: "",
        location: "",
        description: "",
        status: "Open",
        publish: true,
      };

  const [description, setDescription] = useState(() =>
    normalizeJobDescriptionForEditor(init.description),
  );

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      {props.mode === "edit" ? (
        <input type="hidden" name="docName" value={props.docName} />
      ) : null}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="jobTitle" className="text-sm font-medium text-slate-700">
          Job title <span className="text-red-600">*</span>
        </label>
        <input
          id="jobTitle"
          name="jobTitle"
          required
          defaultValue={init.jobTitle}
          className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          placeholder="e.g. Senior Analyst"
        />
        <p className="text-xs text-slate-500">
          This is the headline shown on the opening (ERPNext field{" "}
          <code className="rounded bg-slate-100 px-0.5">job_title</code>).
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="designation" className="text-sm font-medium text-slate-700">
          Designation <span className="text-red-600">*</span>
        </label>
        <input
          id="designation"
          name="designation"
          required
          defaultValue={init.designation}
          className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          placeholder="Must match a Designation in ERPNext"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="department" className="text-sm font-medium text-slate-700">
            Department
          </label>
          <input
            id="department"
            name="department"
            defaultValue={init.department}
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="employmentType" className="text-sm font-medium text-slate-700">
            Employment type
          </label>
          <input
            id="employmentType"
            name="employmentType"
            defaultValue={init.employmentType}
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            placeholder="Link to Employment Type"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="location" className="text-sm font-medium text-slate-700">
          Location (Branch)
        </label>
        <input
          id="location"
          name="location"
          defaultValue={init.location}
          className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          placeholder="Optional — must match Branch if set"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-slate-700">
          Description
        </label>
        <p className="text-xs text-slate-500">
          Rich text from ERPNext is shown as HTML below; edit the markup or use the preview to
          check formatting.
        </p>
        <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-slate-50/80 shadow-inner">
          <p className="shrink-0 px-4 pt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
            Preview
          </p>
          <div className="max-h-52 min-h-0 overflow-y-auto px-4 pb-3">
            {description.trim() ?
              <div
                className={JOB_DESCRIPTION_PREVIEW_HTML_CLASS}
                // HTML originates from ERPNext Job Opening description (trusted for internal recruiters).
                dangerouslySetInnerHTML={{ __html: description }}
              />
            : <p className="text-sm italic text-slate-500">No description yet.</p>}
          </div>
        </div>
        <textarea
          id="description"
          name="description"
          rows={8}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          spellCheck={false}
          className="max-h-52 min-h-30 w-full resize-none overflow-y-auto rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={init.status}
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        <div className="flex items-end pb-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="publish"
              defaultChecked={init.publish}
              className="h-4 w-4 rounded border-slate-300"
            />
            Publish on website
          </label>
        </div>
      </div>
      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Saving…" : props.mode === "create" ? "Create opening" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
