import { IconCircleHelp } from "@/components/icons";
import type { ResolvedOpeningQuestion } from "@/lib/recruitment-questions-demo";

type Props = {
  jobOpeningId: string;
  questions: ResolvedOpeningQuestion[];
};

export function OpeningRecruitmentQuestionsPanel({ jobOpeningId, questions }: Props) {
  if (!questions.length) return null;

  return (
    <section className="w-full rounded-xl border border-dashed border-violet-200 bg-violet-50/40 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700"
              aria-hidden
            >
              <IconCircleHelp className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-slate-900">Application questions</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Applicants see these on the apply form for this opening. Standard questions are always
            included; additional questions are chosen per opening.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-800">
          {questions.length} question{questions.length === 1 ? "" : "s"}
        </span>
      </div>

      <ol className="mt-5 space-y-3">
        {questions.map((q, index) => (
          <li
            key={q.id}
            className="w-full rounded-lg border border-violet-100 bg-white px-4 py-3 text-sm shadow-sm"
          >
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
              <span className="min-w-0 font-medium text-slate-900">
                {index + 1}. {q.question}
              </span>
              <span className="shrink-0 font-mono text-xs text-slate-500 sm:text-right">{q.id}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="rounded bg-slate-100 px-2 py-0.5">{q.question_type}</span>
              {q.is_required ?
                <span className="rounded bg-amber-50 px-2 py-0.5 text-amber-900">Required</span>
              : <span className="rounded bg-slate-100 px-2 py-0.5">Optional</span>}
              {q.category ?
                <span className="rounded bg-slate-100 px-2 py-0.5">{q.category}</span>
              : null}
            </div>
            {q.help_text ?
              <p className="mt-2 text-xs text-slate-500">{q.help_text}</p>
            : null}
            {q.options.length > 0 ?
              <p className="mt-2 text-xs text-slate-500">
                Options: {q.options.join(" · ")}
              </p>
            : null}
          </li>
        ))}
      </ol>

      <p className="mt-4 font-mono text-xs text-slate-500">Opening: {jobOpeningId}</p>
    </section>
  );
}
