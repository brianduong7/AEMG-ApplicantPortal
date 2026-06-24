import { promises as fs } from "node:fs";
import path from "node:path";
import {
  type OpeningQuestionConfig,
  resolveRecruitmentQuestionsForConfig,
} from "@/lib/job-opening-questions-demo";
import type { ResolvedOpeningQuestion } from "@/lib/recruitment-questions-demo";

const DATA_FILE = path.join(process.cwd(), "data", "demo-opening-questions.json");

type OpeningQuestionStore = Record<string, OpeningQuestionConfig>;

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
  return store[id] ?? null;
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
