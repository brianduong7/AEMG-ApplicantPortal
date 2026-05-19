export type JobOfferTermLine = {
  offer_term: string;
  value: string;
};

export function parseJobOfferTermsJson(raw: string): JobOfferTermLine[] {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: JobOfferTermLine[] = [];
    for (const row of parsed) {
      if (!row || typeof row !== "object") continue;
      const offer_term =
        typeof (row as JobOfferTermLine).offer_term === "string" ?
          (row as JobOfferTermLine).offer_term.trim()
        : "";
      const value =
        typeof (row as JobOfferTermLine).value === "string" ?
          (row as JobOfferTermLine).value.trim()
        : "";
      if (offer_term && value) out.push({ offer_term, value });
    }
    return out;
  } catch {
    return [];
  }
}

export function serializeJobOfferTerms(rows: JobOfferTermLine[]): string {
  return JSON.stringify(rows.filter((r) => r.offer_term.trim() && r.value.trim()));
}
