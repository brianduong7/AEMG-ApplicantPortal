/** Demo-only job offer email compose helpers (no real mail delivery). */

export const JOB_OFFER_FROM_EMAIL_OPTIONS = [
  { value: "careers@aemg.edu.au", label: "careers@aemg.edu.au" },
  { value: "careers@aife.edu.au", label: "careers@aife.edu.au" },
] as const;

export type JobOfferFromEmail = (typeof JOB_OFFER_FROM_EMAIL_OPTIONS)[number]["value"];

export function defaultFromEmailForCompany(company?: string | null): JobOfferFromEmail {
  const c = (company ?? "").trim().toUpperCase();
  if (c.includes("AIFE")) return "careers@aife.edu.au";
  return "careers@aemg.edu.au";
}

export function defaultJobOfferEmailSubject(offerDocName: string): string {
  return `Job Offer: ${offerDocName}`;
}

export function defaultJobOfferEmailMessage(input: {
  applicantName?: string | null;
  designation?: string | null;
  company?: string | null;
}): string {
  const name = input.applicantName?.trim() || "Candidate";
  const role = input.designation?.trim() || "the position";
  const org = input.company?.trim() || "our team";

  return [
    `Dear ${name},`,
    "",
    `We are pleased to share your job offer for ${role} at ${org}.`,
    "",
    "Please review the attached offer letter and let us know if you have any questions.",
    "",
    "Kind regards,",
    "Recruitment Team",
  ].join("\n");
}
