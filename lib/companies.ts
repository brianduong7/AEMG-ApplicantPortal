export type CompanyId = "aemg" | "aife";

/** Unified recruiter portal: ERP desk context defaults here (chrome is always AIFE-themed). */
export const RECRUITER_PORTAL_DEFAULT_COMPANY: CompanyId = "aife";

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

/** ERPNext `Company` document name for API filters and Job Opening create (defaults match common desk names). */
export function erpCompanyNameForPortal(company: CompanyId): string {
  if (company === "aife") {
    return (process.env.ERPNEXT_AIFE_COMPANY ?? "AIFE").trim() || "AIFE";
  }
  return (process.env.ERPNEXT_AEMG_COMPANY ?? "AEMG").trim() || "AEMG";
}

/** Map ERPNext `Company` link value from a document to portal company id. */
export function companyIdFromErpCompanyField(erpCompany?: string): CompanyId {
  const raw = erpCompany?.trim();
  if (!raw) return RECRUITER_PORTAL_DEFAULT_COMPANY;
  const lower = raw.toLowerCase();
  const aifeName = (process.env.ERPNEXT_AIFE_COMPANY ?? "AIFE").trim().toLowerCase();
  const aemgName = (process.env.ERPNEXT_AEMG_COMPANY ?? "AEMG").trim().toLowerCase();
  if (lower === aifeName || lower.includes("aife") || lower.includes("future education")) {
    return "aife";
  }
  if (lower === aemgName || lower.includes("aemg")) return "aemg";
  return RECRUITER_PORTAL_DEFAULT_COMPANY;
}

export type ErpCompanyOption = { name: string; label: string };

export function toCompanyFormOptions(
  rows: Array<{ name: string; company_name?: string }>,
): ErpCompanyOption[] {
  return rows
    .map((r) => {
      const name = r.name?.trim() ?? "";
      if (!name) return null;
      return { name, label: r.company_name?.trim() || name };
    })
    .filter((r): r is ErpCompanyOption => r !== null)
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Pick default ERP Company doc name for a portal company (login cookie / session). */
export function defaultErpCompanyNameForPortal(
  companies: ErpCompanyOption[],
  preferred: CompanyId,
): string {
  if (!companies.length) return "";
  const target = erpCompanyNameForPortal(preferred).toLowerCase();
  const exact = companies.find((c) => c.name.toLowerCase() === target);
  if (exact) return exact.name;
  const mapped = companies.find((c) => companyIdFromErpCompanyField(c.name) === preferred);
  if (mapped) return mapped.name;
  return companies[0].name;
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
