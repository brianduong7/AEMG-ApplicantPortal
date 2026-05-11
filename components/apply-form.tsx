"use client";

import { useActionState } from "react";
import { useMemo, useState } from "react";
import type { Job } from "@/lib/jobs";
import type { CompanyId } from "@/lib/companies";
import type { ApplicationState } from "@/app/actions/application";
import { submitApplication } from "@/app/actions/application";
import { COUNTRIES } from "@/lib/countries";
import { getApplyFormTheme } from "@/lib/portal-theme";

type Props = {
  jobs: Job[];
  initialJobId: string;
  company: CompanyId;
};

export function ApplyForm({ jobs, initialJobId, company }: Props) {
  const [state, formAction, pending] = useActionState(
    submitApplication,
    null as ApplicationState,
  );
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);

  const th = getApplyFormTheme(company);
  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId),
    [jobs, selectedJobId],
  );

  if (state?.success && state.jobTitle) {
    return (
      <div className={th.successBox}>
        <p className="font-semibold">Application sent</p>
        <p className="mt-2 text-sm">
          Thanks for applying for <strong>{state.jobTitle}</strong>. This demo does not
          persist files or data—connect your API and storage when you are ready.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6" encType="multipart/form-data">
      <div className={th.sectionBorder}>
        <h3 className={th.sectionTitle}>Details</h3>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="jobOpening" className={th.label}>
            Job opening <span className="text-red-600">*</span>
          </label>
          <select
            id="jobOpening"
            name="jobOpening"
            required
            defaultValue={initialJobId}
            className={th.input}
            onChange={(event) => setSelectedJobId(event.target.value)}
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
          {selectedJob ? (
            <p className="text-xs text-slate-500">
              Job code: <span className="font-medium text-slate-700">{selectedJob.id}</span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="applicantName" className={th.label}>
            Applicant name <span className="text-red-600">*</span>
          </label>
          <input
            id="applicantName"
            name="applicantName"
            type="text"
            autoComplete="name"
            required
            placeholder="Full name"
            className={th.input}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="emailAddress" className={th.label}>
            Email address <span className="text-red-600">*</span>
          </label>
          <input
            id="emailAddress"
            name="emailAddress"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder="you@example.com"
            className={th.input}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="phoneNumber" className={th.label}>
            Phone number
          </label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+61 …"
            className={th.input}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="country" className={th.label}>
            Country
          </label>
          <select id="country" name="country" className={th.input} defaultValue="">
            <option value="">Select country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="resume" className={th.label}>
            Resume attachment <span className="text-red-600">*</span>
          </label>
          <input
            id="resume"
            name="resume"
            type="file"
            required
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className={th.fileInput}
          />
          <p className={th.fileHint}>PDF or Word, up to 5 MB.</p>
        </div>
      </div>

      {state?.error ? (
        <p className={th.errorBox} role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className={th.submit}
      >
        {pending ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
