export type CompanyId = "aemg" | "aife";

export const COMPANY_IDS: CompanyId[] = ["aemg", "aife"];

export function parseCompanyId(raw: unknown): CompanyId | null {
  if (raw === "aemg" || raw === "aife") return raw;
  return null;
}

/** Read `company` from a URL search param; defaults to AEMG when missing or invalid. */
export function companyFromSearchParam(
  value: string | string[] | undefined,
): CompanyId {
  const raw = Array.isArray(value) ? value[0] : value;
  return parseCompanyId(typeof raw === "string" ? raw.trim() : raw) ?? "aemg";
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
