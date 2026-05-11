export type CompanyId = "aemg" | "aife";

export const COMPANY_IDS: CompanyId[] = ["aemg", "aife"];

export function parseCompanyId(raw: unknown): CompanyId | null {
  if (raw === "aemg" || raw === "aife") return raw;
  return null;
}

export const COMPANIES: Record<
  CompanyId,
  { id: CompanyId; label: string; shortLabel: string; logoSrc: string }
> = {
  aemg: {
    id: "aemg",
    label: "AEMG",
    shortLabel: "AEMG",
    logoSrc: "/logos/aemg_no_bg.png",
  },
  aife: {
    id: "aife",
    label: "Australia Institute of Future Education (AIFE)",
    shortLabel: "AIFE",
    logoSrc: "/logos/aife.png",
  },
};
