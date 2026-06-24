import { ApplicantDetailSection } from "@/components/applicant-detail-section";
import type { StoredApplicantRecruitmentAnswers } from "@/lib/applicant-answers-demo";

type Props = {
  record: StoredApplicantRecruitmentAnswers | null;
};

export function ApplicantRecruitmentAnswersPanel({ record }: Props) {
  if (!record?.answers.length) return null;

  return (
    <ApplicantDetailSection
      title="Application questions"
      description="Answers captured at submission (snapshots preserve the wording shown to the applicant)."
    >
      <dl className="flex flex-col gap-4">
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
    </ApplicantDetailSection>
  );
}
