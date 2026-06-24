/** Demo-only reusable recruitment question bank (not ERPNext DocTypes). */

export type RecruitmentQuestionType =
  | "short_text"
  | "long_text"
  | "yes_no"
  | "single_select"
  | "multi_select"
  | "number"
  | "date";

export type RecruitmentQuestion = {
  id: string;
  question: string;
  question_type: RecruitmentQuestionType;
  options?: string[];
  is_required_default: boolean;
  help_text?: string;
  category?: string;
  is_active: boolean;
  sort_order: number;
};

/** Shown on every job opening application form. */
export const DEMO_DEFAULT_QUESTION_IDS = ["REC-Q-0001", "REC-Q-0002"] as const;

export const DEMO_RECRUITMENT_QUESTION_BANK: RecruitmentQuestion[] = [
  {
    id: "REC-Q-0001",
    question: "Do you have Australian working rights?",
    question_type: "yes_no",
    is_required_default: true,
    help_text: "Select Yes if you are an Australian citizen, permanent resident, or hold a valid visa with work rights.",
    category: "Eligibility",
    is_active: true,
    sort_order: 1,
  },
  {
    id: "REC-Q-0002",
    question: "What is your availability?",
    question_type: "long_text",
    is_required_default: true,
    help_text: "Include days, hours, and any notice period.",
    category: "Availability",
    is_active: true,
    sort_order: 2,
  },
  {
    id: "REC-Q-0003",
    question: "Why do you want this role?",
    question_type: "long_text",
    is_required_default: false,
    category: "Motivation",
    is_active: true,
    sort_order: 3,
  },
  {
    id: "REC-Q-0004",
    question: "How many years of relevant experience do you have?",
    question_type: "number",
    is_required_default: false,
    help_text: "Enter a whole number.",
    category: "Experience",
    is_active: true,
    sort_order: 4,
  },
  {
    id: "REC-Q-0005",
    question: "What is your highest qualification?",
    question_type: "single_select",
    options: ["High school", "Certificate / Diploma", "Bachelor degree", "Postgraduate", "Other"],
    is_required_default: false,
    category: "Education",
    is_active: true,
    sort_order: 5,
  },
  {
    id: "REC-Q-0006",
    question: "Do you hold a current driver's licence?",
    question_type: "yes_no",
    is_required_default: false,
    category: "Eligibility",
    is_active: true,
    sort_order: 6,
  },
  {
    id: "REC-Q-0007",
    question: "What is your earliest available start date?",
    question_type: "date",
    is_required_default: false,
    category: "Availability",
    is_active: true,
    sort_order: 7,
  },
  {
    id: "REC-Q-0008",
    question: "Which work arrangements suit you?",
    question_type: "multi_select",
    options: ["On-site", "Hybrid", "Remote", "Flexible hours", "Part-time"],
    is_required_default: false,
    help_text: "Select all that apply.",
    category: "Preferences",
    is_active: true,
    sort_order: 8,
  },
  {
    id: "REC-Q-0009",
    question: "Describe a relevant achievement or outcome from your recent work.",
    question_type: "long_text",
    is_required_default: false,
    category: "Experience",
    is_active: true,
    sort_order: 9,
  },
  {
    id: "REC-Q-0010",
    question: "Are you willing to undergo employment screening (reference and background checks)?",
    question_type: "yes_no",
    is_required_default: false,
    category: "Compliance",
    is_active: true,
    sort_order: 10,
  },
];

const bankById = new Map(
  DEMO_RECRUITMENT_QUESTION_BANK.map((q) => [q.id, q] as const),
);

export function getRecruitmentQuestionById(id: string): RecruitmentQuestion | undefined {
  return bankById.get(id.trim());
}

export type ResolvedOpeningQuestion = {
  id: string;
  question: string;
  question_type: RecruitmentQuestionType;
  is_required: boolean;
  options: string[];
  help_text: string;
  sort_order: number;
  category?: string;
};

export type OpeningQuestionOverride = {
  is_required?: boolean;
  help_text?: string;
  options?: string[];
};

export function resolveQuestionsFromIds(
  questionIds: string[],
  overrides?: Record<string, OpeningQuestionOverride>,
): ResolvedOpeningQuestion[] {
  const out: ResolvedOpeningQuestion[] = [];
  for (const rawId of questionIds) {
    const id = rawId.trim();
    const master = bankById.get(id);
    if (!master || !master.is_active) continue;
    const o = overrides?.[id];
    out.push({
      id,
      question: master.question,
      question_type: master.question_type,
      is_required: o?.is_required ?? master.is_required_default,
      options: o?.options ?? master.options ?? [],
      help_text: o?.help_text ?? master.help_text ?? "",
      sort_order: master.sort_order,
      category: master.category,
    });
  }
  return out.sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
}

/** Form field name prefix for recruitment answers in multipart submissions. */
export const RECRUITMENT_ANSWER_FIELD_PREFIX = "rq__";

export function recruitmentAnswerFieldName(questionId: string): string {
  return `${RECRUITMENT_ANSWER_FIELD_PREFIX}${questionId.trim()}`;
}

export type ParsedRecruitmentAnswer = {
  recruitment_question: string;
  question_text_snapshot: string;
  question_type_snapshot: RecruitmentQuestionType;
  is_required_snapshot: boolean;
  answer_text: string;
  answer_json?: string;
  sort_order: number;
};

export function parseRecruitmentAnswersFromFormData(
  formData: FormData,
  questions: ResolvedOpeningQuestion[],
): ParsedRecruitmentAnswer[] {
  const answers: ParsedRecruitmentAnswer[] = [];

  for (const q of questions) {
    const field = recruitmentAnswerFieldName(q.id);
    let answerText = "";
    let answerJson: string | undefined;

    if (q.question_type === "multi_select") {
      const values = formData
        .getAll(field)
        .map((v) => String(v).trim())
        .filter(Boolean);
      answerText = values.join(", ");
      answerJson = JSON.stringify(values);
    } else {
      answerText = String(formData.get(field) ?? "").trim();
    }

    answers.push({
      recruitment_question: q.id,
      question_text_snapshot: q.question,
      question_type_snapshot: q.question_type,
      is_required_snapshot: q.is_required,
      answer_text: answerText,
      answer_json: answerJson,
      sort_order: q.sort_order,
    });
  }

  return answers.sort((a, b) => a.sort_order - b.sort_order);
}

export function validateRecruitmentAnswers(
  answers: ParsedRecruitmentAnswer[],
  questions: ResolvedOpeningQuestion[],
): string | null {
  const byId = new Map(answers.map((a) => [a.recruitment_question, a]));

  for (const q of questions) {
    const row = byId.get(q.id);
    const value = row?.answer_text.trim() ?? "";

    if (q.is_required && !value) {
      return `Please answer: ${q.question}`;
    }

    if (!value) continue;

    if (q.question_type === "yes_no" && value !== "Yes" && value !== "No") {
      return `Please select Yes or No for: ${q.question}`;
    }

    if (q.question_type === "number") {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0) {
        return `Enter a valid number for: ${q.question}`;
      }
    }

    if (q.question_type === "single_select" && q.options.length > 0) {
      if (!q.options.includes(value)) {
        return `Please choose a valid option for: ${q.question}`;
      }
    }

    if (q.question_type === "multi_select" && q.options.length > 0 && row?.answer_json) {
      try {
        const selected = JSON.parse(row.answer_json) as unknown;
        if (!Array.isArray(selected) || selected.some((v) => !q.options.includes(String(v)))) {
          return `Please choose valid options for: ${q.question}`;
        }
      } catch {
        return `Please choose valid options for: ${q.question}`;
      }
    }
  }

  return null;
}

export function formatRecruitmentAnswersForCoverLetter(
  answers: ParsedRecruitmentAnswer[],
): string {
  if (!answers.length) return "";
  const lines = ["--- Application questions ---", ""];
  for (const a of answers) {
    lines.push(`Q: ${a.question_text_snapshot}`);
    lines.push(`A: ${a.answer_text || "—"}`);
    lines.push("");
  }
  return lines.join("\n").trim();
}
