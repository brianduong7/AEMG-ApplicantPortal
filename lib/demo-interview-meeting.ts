import { promises as fs } from "node:fs";
import path from "node:path";

export type StoredInterviewMeeting = {
  interviewId: string;
  meetingUrl: string;
  createdAt: string;
};

const DATA_FILE = path.join(process.cwd(), "data", "demo-interview-meetings.json");

type MeetingStore = Record<string, StoredInterviewMeeting>;

async function readStore(): Promise<MeetingStore> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as MeetingStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: MeetingStore): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

/** Deterministic placeholder Teams join URL (not a real meeting). */
export function buildDemoTeamsMeetingUrl(interviewId: string): string {
  const slug = interviewId.trim().replace(/[^\w-]/g, "-");
  return `https://teams.microsoft.com/l/meetup-join/19%3ameeting_${encodeURIComponent(slug)}%40thread.v2/0?context=%7b%22Tid%22%3a%22demo%22%7d`;
}

export async function saveDemoInterviewMeeting(interviewId: string): Promise<string> {
  const trimmed = interviewId.trim();
  const meetingUrl = buildDemoTeamsMeetingUrl(trimmed);
  const store = await readStore();
  store[trimmed] = {
    interviewId: trimmed,
    meetingUrl,
    createdAt: new Date().toISOString(),
  };
  await writeStore(store);
  return meetingUrl;
}

export async function getDemoInterviewMeetingUrl(interviewId: string): Promise<string> {
  const trimmed = interviewId.trim();
  if (!trimmed) return buildDemoTeamsMeetingUrl("interview");
  const store = await readStore();
  return store[trimmed]?.meetingUrl ?? buildDemoTeamsMeetingUrl(trimmed);
}

export async function getDemoInterviewMeetingUrls(
  interviewIds: string[],
): Promise<Record<string, string>> {
  const store = await readStore();
  const out: Record<string, string> = {};
  for (const raw of interviewIds) {
    const id = raw.trim();
    if (!id) continue;
    out[id] = store[id]?.meetingUrl ?? buildDemoTeamsMeetingUrl(id);
  }
  return out;
}
