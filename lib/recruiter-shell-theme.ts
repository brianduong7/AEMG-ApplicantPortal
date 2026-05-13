import type { CompanyId } from "@/lib/companies";

/** Recruiter portal chrome: white logo strip, brand sidebar, secondary-tint main column. */
export type RecruiterShellTheme = {
  logoStrip: string;
  sidebarBody: string;
  footerBar: string;
  navLinkActive: string;
  navLinkInactive: string;
  disabledRow: string;
  logoutButton: string;
  asideOuter: string;
  mainColumn: string;
  headerBar: string;
  mobileMenuBtn: string;
  notifyBtn: string;
  notifyBadge: string;
  profileAvatar: string;
  profileChip: string;
};

export const RECRUITER_SHELL_THEME: Record<CompanyId, RecruiterShellTheme> = {
  aemg: {
    logoStrip:
      "flex shrink-0 border-b border-slate-200/90 bg-white px-4 py-5 transition hover:bg-slate-50/90",
    sidebarBody: "flex min-h-0 flex-1 flex-col bg-[#00AEEF] text-white",
    footerBar: "shrink-0 border-t border-white/20 p-3 text-white",
    navLinkActive:
      "border-l-[3px] border-white bg-white/20 font-medium text-white shadow-sm",
    navLinkInactive:
      "border-l-[3px] border-transparent text-white/90 hover:bg-white/10 hover:text-white",
    disabledRow:
      "pointer-events-none flex cursor-not-allowed select-none items-center gap-3 rounded-lg py-2.5 pl-3 pr-3 text-sm font-medium text-white/40",
    logoutButton:
      "mt-0.5 flex w-full items-center gap-3 rounded-lg py-2.5 pl-3 pr-3 text-left text-sm font-medium text-white/95 transition hover:bg-white/10",
    asideOuter:
      "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-slate-200/90 shadow-lg transition-transform duration-200 md:shadow-sm",
    mainColumn:
      "flex min-h-full flex-1 flex-col bg-gradient-to-b from-[#fff7ed] via-[#fffdfb] to-sky-50/40 md:pl-[260px]",
    headerBar:
      "sticky top-0 z-20 flex h-16 w-full items-center justify-between gap-4 border-b border-[#E8961E]/15 bg-white/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/75 md:px-6",
    mobileMenuBtn: "rounded-lg p-2 text-[#0a1628] hover:bg-slate-100 md:hidden",
    notifyBtn:
      "relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900",
    notifyBadge:
      "absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#00AEEF] px-1 text-[10px] font-semibold text-white",
    profileAvatar:
      "flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#E8961E] to-[#00AEEF] text-sm font-semibold text-white shadow-sm",
    profileChip:
      "flex items-center gap-2 rounded-full border border-slate-200/90 bg-white py-1.5 pl-1.5 pr-3 shadow-sm",
  },
  aife: {
    logoStrip:
      "flex shrink-0 border-b border-slate-200/90 bg-white px-4 py-5 transition hover:bg-slate-50/90",
    sidebarBody: "flex min-h-0 flex-1 flex-col bg-[#0a1628] text-white",
    footerBar: "shrink-0 border-t border-white/15 p-3 text-white",
    navLinkActive:
      "border-l-[3px] border-[#0d4f6e] bg-white/10 font-medium text-white",
    navLinkInactive:
      "border-l-[3px] border-transparent text-white/88 hover:bg-white/8 hover:text-white",
    disabledRow:
      "pointer-events-none flex cursor-not-allowed select-none items-center gap-3 rounded-lg py-2.5 pl-3 pr-3 text-sm font-medium text-white/38",
    logoutButton:
      "mt-0.5 flex w-full items-center gap-3 rounded-lg py-2.5 pl-3 pr-3 text-left text-sm font-medium text-white/95 transition hover:bg-white/10",
    asideOuter:
      "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-slate-200/90 shadow-lg transition-transform duration-200 md:shadow-sm",
    mainColumn:
      "flex min-h-full flex-1 flex-col bg-gradient-to-b from-slate-100/95 via-[#f0f4f8] to-white md:pl-[260px]",
    headerBar:
      "sticky top-0 z-20 flex h-16 w-full items-center justify-between gap-4 border-b border-[#0a1628]/10 bg-white/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/75 md:px-6",
    mobileMenuBtn: "rounded-lg p-2 text-[#0a1628] hover:bg-slate-100 md:hidden",
    notifyBtn:
      "relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900",
    notifyBadge:
      "absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#0a1628] px-1 text-[10px] font-semibold text-white",
    profileAvatar:
      "flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#0d4f6e] to-[#0a1628] text-sm font-semibold text-white shadow-sm",
    profileChip:
      "flex items-center gap-2 rounded-full border border-slate-200/90 bg-white py-1.5 pl-1.5 pr-3 shadow-sm",
  },
};

export function getRecruiterShellTheme(companyId: CompanyId): RecruiterShellTheme {
  return RECRUITER_SHELL_THEME[companyId];
}
