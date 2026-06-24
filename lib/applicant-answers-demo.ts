import { promises as fs } from "node:fs";
import path from "node:path";
import type { ParsedRecruitmentAnswer } from "@/lib/recruitment-questions-demo";

export type StoredApplicantRecruitmentAnswers = {
  jobOpeningId: string;
  jobApplicantId: string;
  submittedAt: string;
  answers: ParsedRecruitmentAnswer[];
};

const DATA_FILE = path.join(process.cwd(), "data", "demo-applicant-answers.json");

type AnswersStore = Record<string, StoredApplicantRecruitmentAnswers>;

async function readStore(): Promise<AnswersStore> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as AnswersStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: AnswersStore): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

export async function saveDemoApplicantRecruitmentAnswers(
  input: StoredApplicantRecruitmentAnswers,
): Promise<void> {
  const store = await readStore();
  store[input.jobApplicantId.trim()] = input;
  await writeStore(store);
}

export async function getDemoApplicantRecruitmentAnswers(
  jobApplicantId: string,
): Promise<StoredApplicantRecruitmentAnswers | null> {
  const store = await readStore();
  return store[jobApplicantId.trim()] ?? null;
}
