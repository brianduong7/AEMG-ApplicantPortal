"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  jobTitle: string;
  jobId: string;
  company: "aemg" | "aife";
};

const inputClass =
  "w-full rounded border border-slate-200 bg-[#f4f6f8] px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0096d6] focus:ring-1 focus:ring-[#0096d6]/30";
const labelClass = "mb-1 block text-sm font-bold text-slate-900";

export function CareersApplyForm({ jobTitle, jobId, company }: Props) {
  const [fileName, setFileName] = useState<string | null>(null);
  const applyHref = `/applicant/login?company=${encodeURIComponent(company)}&intent=applicant&from=${encodeURIComponent(`/applicant/jobs/${encodeURIComponent(jobId)}/apply`)}`;

  return (
    <section className="border-t border-slate-200 bg-white py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h2 className="text-xl font-bold text-slate-900">Apply For Job</h2>
        <p className="mt-2 text-sm text-slate-600">
          This form mirrors the public careers website. To submit an application, continue in the
          applicant portal (résumé upload and tracking).
        </p>

        <form
          className="mt-8 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = applyHref;
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="careers-first-name" className={labelClass}>
                First Name <span className="text-red-600">*</span>
              </label>
              <input
                id="careers-first-name"
                name="firstName"
                required
                placeholder="First name here"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="careers-last-name" className={labelClass}>
                Last Name <span className="text-red-600">*</span>
              </label>
              <input
                id="careers-last-name"
                name="lastName"
                required
                placeholder="Last name here"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="careers-email" className={labelClass}>
                Email Address <span className="text-red-600">*</span>
              </label>
              <input
                id="careers-email"
                name="email"
                type="email"
                required
                placeholder="Add email"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="careers-mobile" className={labelClass}>
                Mobile <span className="text-red-600">*</span>
              </label>
              <input
                id="careers-mobile"
                name="mobile"
                required
                placeholder="Add Mobile"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="careers-position" className={labelClass}>
                Position applying for <span className="text-red-600">*</span>
              </label>
              <input
                id="careers-position"
                name="position"
                readOnly
                value={jobTitle}
                className={`${inputClass} bg-slate-100`}
              />
            </div>
          </div>

          <div>
            <span className={labelClass}>
              Resume/CV <span className="text-red-600">*</span> (Cover Letter)
            </span>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <label className="cursor-pointer rounded bg-[#0096d6] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#0077b6]">
                Choose a file
                <input
                  type="file"
                  className="sr-only"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                />
              </label>
              <span className="text-sm text-slate-500">{fileName ?? "No file chosen"}</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 pt-2">
            <button
              type="submit"
              className="rounded bg-[#0096d6] px-10 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#0077b6]"
            >
              Submit
            </button>
            <Link href={applyHref} className="text-sm font-medium text-[#0096d6] hover:underline">
              Or sign in to the applicant portal →
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
