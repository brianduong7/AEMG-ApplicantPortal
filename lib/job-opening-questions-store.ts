import { promises as fs } from "node:fs";
import path from "node:path";
import {
  type OpeningQuestionConfig,
  resolveRecruitmentQuestionsForConfig,
} from "@/lib/job-opening-questions-demo";
import type { ResolvedOpeningQuestion } from "@/lib/recruitment-questions-demo";

const DATA_FILE = path.join(process.cwd(), "data", "demo-opening-questions.json");

type OpeningQuestionStore = Record<string, OpeningQuestionConfig>;

/** Seed mappings for local fallback jobs when no saved config exists. */
const FALLBACK_OPENING_QUESTION_CONFIG: Record<string, OpeningQuestionConfig> = {
  "aemg-senior-software-engineer": {
    additionalQuestionIds: ["REC-Q-0003", "REC-Q-0004", "REC-Q-0005"],
    overrides: { "REC-Q-0004": { is_required: true } },
  },
  "aemg-campus-admissions-officer": {
    additionalQuestionIds: ["REC-Q-0003", "REC-Q-0006", "REC-Q-0007"],
  },
  "aemg-student-support-officer": {
    additionalQuestionIds: ["REC-Q-0003", "REC-Q-0008", "REC-Q-0009"],
  },
  "aemg-finance-officer": {
    additionalQuestionIds: ["REC-Q-0004", "REC-Q-0005", "REC-Q-0010"],
  },
  "aemg-marketing-coordinator": {
    additionalQuestionIds: ["REC-Q-0003", "REC-Q-0005"],
  },
  "aemg-it-support-analyst": {
    additionalQuestionIds: ["REC-Q-0004", "REC-Q-0006"],
  },
  "aife-student-support-coordinator": {
    additionalQuestionIds: ["REC-Q-0004", "REC-Q-0008", "REC-Q-0009"],
    overrides: { "REC-Q-0009": { is_required: true } },
  },
  "aife-marketing-executive": {
    additionalQuestionIds: ["REC-Q-0005", "REC-Q-0009", "REC-Q-0010"],
  },
  "aife-accountant": {
    additionalQuestionIds: ["REC-Q-0004", "REC-Q-0005", "REC-Q-0010"],
  },
  "aife-enrolments-officer": {
    additionalQuestionIds: ["REC-Q-0003", "REC-Q-0007"],
  },
  "aife-academic-coordinator": {
    additionalQuestionIds: ["REC-Q-0008", "REC-Q-0009"],
  },
  "aife-pathway-counsellor": {
    additionalQuestionIds: ["REC-Q-0003", "REC-Q-0006", "REC-Q-0008"],
  },
};

async function readStore(): Promise<OpeningQuestionStore> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as OpeningQuestionStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: OpeningQuestionStore): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

export async function saveOpeningQuestionConfig(
  jobOpeningId: string,
  config: OpeningQuestionConfig,
): Promise<void> {
  const id = jobOpeningId.trim();
  if (!id) return;
  const store = await readStore();
  store[id] = {
    additionalQuestionIds: [
      ...new Set(config.additionalQuestionIds.map((q) => q.trim()).filter(Boolean)),
    ],
    overrides: config.overrides,
  };
  await writeStore(store);
}

export async function getOpeningQuestionConfig(
  jobOpeningId: string,
): Promise<OpeningQuestionConfig | null> {
  const id = jobOpeningId.trim();
  if (!id) return null;
  const store = await readStore();
  if (store[id]) return store[id];
  return FALLBACK_OPENING_QUESTION_CONFIG[id] ?? null;
}

function configWithDefaults(cfg: OpeningQuestionConfig | null): OpeningQuestionConfig {
  return cfg ?? { additionalQuestionIds: [] };
}

export async function getRecruitmentQuestionsForOpening(
  jobOpeningId: string,
): Promise<ResolvedOpeningQuestion[]> {
  const cfg = configWithDefaults(await getOpeningQuestionConfig(jobOpeningId));
  return resolveRecruitmentQuestionsForConfig(cfg);
}

export async function getRecruitmentQuestionsByJobIds(
  jobOpeningIds: string[],
): Promise<Record<string, ResolvedOpeningQuestion[]>> {
  const out: Record<string, ResolvedOpeningQuestion[]> = {};
  await Promise.all(
    jobOpeningIds.map(async (id) => {
      const trimmed = id.trim();
      if (!trimmed) return;
      out[trimmed] = await getRecruitmentQuestionsForOpening(trimmed);
    }),
  );
  return out;
}

export async function getAdditionalQuestionIdsForOpening(
  jobOpeningId: string,
): Promise<string[]> {
  const cfg = await getOpeningQuestionConfig(jobOpeningId);
  return cfg?.additionalQuestionIds ?? [];
}
