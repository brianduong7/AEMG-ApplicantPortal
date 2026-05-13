import type { CompanyId } from "@/lib/companies";
import {
  type RecruiterShellTheme,
  RECRUITER_SHELL_THEME,
} from "@/lib/recruiter-shell-theme";

/** Applicant portal chrome: same sidebar pattern as recruiter; warm main canvas (#fdfaf5). */
export type ApplicantShellTheme = RecruiterShellTheme;

export const APPLICANT_SHELL_THEME: Record<CompanyId, ApplicantShellTheme> = {
  aemg: {
    ...RECRUITER_SHELL_THEME.aemg,
    mainColumn:
      "flex min-h-dvh min-h-0 flex-1 flex-col bg-[#fdfaf5] md:pl-[260px]",
    headerBar:
      "sticky top-0 z-20 flex h-16 w-full shrink-0 items-center justify-between gap-4 border-b border-[#E8961E]/10 bg-white px-4 shadow-sm md:px-6",
  },
  aife: {
    ...RECRUITER_SHELL_THEME.aife,
    mainColumn:
      "flex min-h-dvh min-h-0 flex-1 flex-col bg-[#f7f5f2] md:pl-[260px]",
    headerBar:
      "sticky top-0 z-20 flex h-16 w-full shrink-0 items-center justify-between gap-4 border-b border-[#0a1628]/10 bg-white px-4 shadow-sm md:px-6",
  },
};

export function getApplicantShellTheme(companyId: CompanyId): ApplicantShellTheme {
  return APPLICANT_SHELL_THEME[companyId];
}
