"use client";

import { useState } from "react";
import { IconCircleHelp } from "@/components/icons";
import type { StoredApplicantRecruitmentAnswers } from "@/lib/applicant-answers-demo";

type Props = {
  record: StoredApplicantRecruitmentAnswers | null;
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`size-5 shrink-0 text-slate-500 transition-transform ${open ? "rotate-90" : ""}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function ApplicantRecruitmentAnswersPanel({ record }: Props) {
  const [open, setOpen] = useState(false);

  if (!record?.answers.length) return null;

  const count = record.answers.length;

  return (
    <section className="overflow-hidden rounded-xl border border-violet-200/80 bg-violet-50/30 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-violet-50/60 sm:px-6"
        aria-expanded={open}
      >
        <ChevronIcon open={open} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700"
              aria-hidden
            >
              <IconCircleHelp className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Application questions
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {count} answer{count === 1 ? "" : "s"} captured at submission
            {!open ? " — click to view" : null}
          </p>
        </div>
      </button>

      {open ?
        <div className="border-t border-violet-200/80 px-4 pb-5 pt-4 sm:px-6">
          <p className="text-xs text-slate-500">
            Snapshots preserve the wording shown to the applicant at apply time.
          </p>
          <dl className="mt-4 flex flex-col gap-4">
            {record.answers.map((a) => (
              <div
                key={`${a.recruitment_question}-${a.sort_order}`}
                className="rounded-lg border border-violet-100 bg-violet-50/40 px-4 py-3"
              >
                <dt className="text-sm font-medium text-slate-900">{a.question_text_snapshot}</dt>
                <dd className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
                  {a.answer_text || "—"}
                </dd>
                <dd className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="font-mono">{a.recruitment_question}</span>
                  <span>·</span>
                  <span>{a.question_type_snapshot}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      : null}
    </section>
  );
}
