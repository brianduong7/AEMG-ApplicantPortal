import {
  DEMO_DEFAULT_QUESTION_IDS,
  DEMO_RECRUITMENT_QUESTION_BANK,
  type OpeningQuestionOverride,
  type RecruitmentQuestion,
  type ResolvedOpeningQuestion,
  resolveQuestionsFromIds,
} from "@/lib/recruitment-questions-demo";

export type OpeningQuestionConfig = {
  /** Question ids beyond {@link DEMO_DEFAULT_QUESTION_IDS}. */
  additionalQuestionIds: string[];
  overrides?: Record<string, OpeningQuestionOverride>;
};

/** Form field name for optional question checkboxes (safe for client components). */
export const ADDITIONAL_RECRUITMENT_QUESTION_FIELD = "additionalRecruitmentQuestion";

export function getDefaultPoolQuestions(): RecruitmentQuestion[] {
  const defaultSet = new Set<string>(DEMO_DEFAULT_QUESTION_IDS);
  return DEMO_RECRUITMENT_QUESTION_BANK.filter(
    (q) => q.is_active && defaultSet.has(q.id),
  ).sort((a, b) => a.sort_order - b.sort_order);
}

export function getOptionalPoolQuestions(): RecruitmentQuestion[] {
  const defaultSet = new Set<string>(DEMO_DEFAULT_QUESTION_IDS);
  return DEMO_RECRUITMENT_QUESTION_BANK.filter(
    (q) => q.is_active && !defaultSet.has(q.id),
  ).sort((a, b) => a.sort_order - b.sort_order);
}

export function parseAdditionalQuestionIdsFromFormData(formData: FormData): string[] {
  const valid = new Set(getOptionalPoolQuestions().map((q) => q.id));
  return [
    ...new Set(
      formData
        .getAll(ADDITIONAL_RECRUITMENT_QUESTION_FIELD)
        .map((v) => String(v).trim())
        .filter((id) => valid.has(id)),
    ),
  ];
}

export function getQuestionIdsForConfig(cfg: OpeningQuestionConfig): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const qid of [...DEMO_DEFAULT_QUESTION_IDS, ...cfg.additionalQuestionIds]) {
    if (seen.has(qid)) continue;
    seen.add(qid);
    ids.push(qid);
  }
  return ids;
}

export function resolveRecruitmentQuestionsForConfig(
  cfg: OpeningQuestionConfig,
): ResolvedOpeningQuestion[] {
  return resolveQuestionsFromIds(getQuestionIdsForConfig(cfg), cfg.overrides);
}
