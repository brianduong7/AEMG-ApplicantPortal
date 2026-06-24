"use client";

import type { ResolvedOpeningQuestion } from "@/lib/recruitment-questions-demo";
import { recruitmentAnswerFieldName } from "@/lib/recruitment-questions-demo";
import type { ApplyFormTheme } from "@/lib/portal-theme";

type Props = {
  questions: ResolvedOpeningQuestion[];
  theme: ApplyFormTheme;
};

export function RecruitmentQuestionsFields({ questions, theme }: Props) {
  if (!questions.length) return null;

  return (
    <div className="flex flex-col gap-6">
      {questions.map((q) => (
        <QuestionField key={q.id} question={q} theme={theme} />
      ))}
    </div>
  );
}

function QuestionField({
  question: q,
  theme,
}: {
  question: ResolvedOpeningQuestion;
  theme: ApplyFormTheme;
}) {
  const field = recruitmentAnswerFieldName(q.id);
  const requiredMark = q.is_required ? (
    <span className="text-red-600"> *</span>
  ) : null;

  const label = (
    <label htmlFor={field} className={theme.label}>
      {q.question}
      {requiredMark}
    </label>
  );

  const help =
    q.help_text ?
      <p className="text-xs text-slate-500">{q.help_text}</p>
    : null;

  if (q.question_type === "yes_no") {
    return (
      <fieldset className="flex flex-col gap-2">
        <legend className={`${theme.label} mb-1`}>
          {q.question}
          {requiredMark}
        </legend>
        {help}
        <div className="flex flex-wrap gap-4">
          {(["Yes", "No"] as const).map((value) => (
            <label key={value} className="flex items-center gap-2 text-sm text-slate-800">
              <input
                type="radio"
                name={field}
                value={value}
                required={q.is_required}
                className="size-4 border-slate-300 text-slate-900 focus:ring-slate-400"
              />
              {value}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (q.question_type === "long_text") {
    return (
      <div className="flex flex-col gap-1.5">
        {label}
        {help}
        <textarea
          id={field}
          name={field}
          rows={4}
          required={q.is_required}
          className={theme.input}
        />
      </div>
    );
  }

  if (q.question_type === "single_select") {
    return (
      <div className="flex flex-col gap-1.5">
        {label}
        {help}
        <select id={field} name={field} required={q.is_required} className={theme.input} defaultValue="">
          <option value="" disabled>
            Select an option
          </option>
          {q.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (q.question_type === "multi_select") {
    return (
      <fieldset className="flex flex-col gap-2">
        <legend className={`${theme.label} mb-1`}>
          {q.question}
          {requiredMark}
        </legend>
        {help}
        <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
          {q.options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                name={field}
                value={opt}
                className="size-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
              />
              {opt}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (q.question_type === "number") {
    return (
      <div className="flex flex-col gap-1.5">
        {label}
        {help}
        <input
          id={field}
          name={field}
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          required={q.is_required}
          className={theme.input}
        />
      </div>
    );
  }

  if (q.question_type === "date") {
    return (
      <div className="flex flex-col gap-1.5">
        {label}
        {help}
        <input
          id={field}
          name={field}
          type="date"
          required={q.is_required}
          className={theme.input}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label}
      {help}
      <input
        id={field}
        name={field}
        type="text"
        required={q.is_required}
        className={theme.input}
      />
    </div>
  );
}
