import type { CompanyId } from "@/lib/companies";

/** Light UI everywhere; brand accents: AEMG #E8961E + #00AEEF, AIFE navy #0a1628 */

export type PortalTheme = {
  shell: string;
  header: string;
  headerLink: string;
  headerMuted: string;
  signOutButton: string;
  pageTitle: string;
  pageSubtitle: string;
  backLink: string;
  jobCard: string;
  jobCardTitle: string;
  jobCardTitleHover: string;
  jobCardBody: string;
  jobPillPrimary: string;
  jobPillMuted: string;
  jobApplyLink: string;
  applySection: string;
  applySectionTitle: string;
  applySectionHint: string;
};

export const PORTAL_THEME: Record<CompanyId, PortalTheme> = {
  aemg: {
    shell:
      "flex min-h-full flex-1 flex-col bg-gradient-to-b from-sky-50/80 via-white to-white",
    header: "border-b border-[#00AEEF]/25 bg-white/95 shadow-sm backdrop-blur",
    headerLink: "text-sm font-semibold text-[#00AEEF]",
    headerMuted: "hidden max-w-[14rem] truncate text-slate-600 sm:inline",
    signOutButton:
      "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 transition hover:border-[#00AEEF]/40 hover:bg-sky-50/50",
    pageTitle: "text-2xl font-semibold tracking-tight text-slate-900",
    pageSubtitle: "mt-2 max-w-2xl text-slate-600",
    backLink: "text-sm font-medium text-[#00AEEF] hover:underline",
    jobCard:
      "group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#00AEEF]/45 hover:shadow-md",
    jobCardTitle:
      "text-lg font-semibold text-slate-900 group-hover:text-[#E8961E]",
    jobCardTitleHover: "",
    jobCardBody: "mt-1 text-sm text-slate-600",
    jobPillPrimary:
      "rounded-full bg-[#E8961E]/15 px-2.5 py-1 text-xs font-medium text-[#c9790e]",
    jobPillMuted:
      "rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700",
    jobApplyLink: "mt-4 text-sm font-medium text-[#00AEEF]",
    applySection:
      "rounded-xl border border-slate-200 bg-white p-6 shadow-sm",
    applySectionTitle: "text-lg font-semibold text-slate-900",
    applySectionHint: "mt-1 text-sm text-slate-600",
  },
  aife: {
    shell:
      "flex min-h-full flex-1 flex-col bg-gradient-to-b from-slate-50 via-white to-[#f4f7fb]",
    header: "border-b border-[#0a1628]/10 bg-white/95 shadow-sm backdrop-blur",
    headerLink: "text-sm font-semibold text-[#0a1628]",
    headerMuted: "hidden max-w-[14rem] truncate text-slate-600 sm:inline",
    signOutButton:
      "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 transition hover:border-[#0a1628]/25 hover:bg-slate-50",
    pageTitle: "text-2xl font-semibold tracking-tight text-slate-900",
    pageSubtitle: "mt-2 max-w-2xl text-slate-600",
    backLink: "text-sm font-medium text-[#0d4f6e] hover:text-[#0a1628] hover:underline",
    jobCard:
      "group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#0a1628]/20 hover:shadow-md",
    jobCardTitle:
      "text-lg font-semibold text-slate-900 group-hover:text-[#0a1628]",
    jobCardTitleHover: "",
    jobCardBody: "mt-1 text-sm text-slate-600",
    jobPillPrimary:
      "rounded-full bg-[#0a1628]/10 px-2.5 py-1 text-xs font-medium text-[#0a1628]",
    jobPillMuted:
      "rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700",
    jobApplyLink: "mt-4 text-sm font-medium text-[#0d4f6e]",
    applySection:
      "rounded-xl border border-slate-200 bg-white p-6 shadow-sm",
    applySectionTitle: "text-lg font-semibold text-slate-900",
    applySectionHint: "mt-1 text-sm text-slate-600",
  },
};

export type LoginTheme = {
  outer: string;
  overlay: string;
  card: string;
  eyebrow: string;
  title: string;
  description: string;
  footerHint: string;
  contactLink: string;
  label: string;
  input: string;
  select: string;
  submit: string;
  demoNote: string;
  errorBox: string;
};

export const LOGIN_THEME: Record<CompanyId, LoginTheme> = {
  aemg: {
    outer:
      "relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-sky-100/60 via-white to-[#fff7ed] px-4 py-16",
    overlay:
      "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(0,174,239,0.14),transparent_55%)]",
    card:
      "relative w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50",
    eyebrow: "text-xs font-semibold uppercase tracking-wider text-[#E8961E]",
    title: "mt-2 text-2xl font-semibold tracking-tight text-slate-900",
    description: "mt-2 text-sm text-slate-600",
    footerHint: "mt-6 text-center text-xs text-slate-500",
    contactLink: "font-medium text-[#00AEEF] hover:underline",
    label: "text-sm font-medium text-slate-700",
    input:
      "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20",
    select:
      "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20",
    submit:
      "w-full rounded-lg bg-[#E8961E] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d1841a] disabled:cursor-not-allowed disabled:opacity-60",
    demoNote: "text-center text-xs text-slate-500",
    errorBox: "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100",
  },
  aife: {
    outer:
      "relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100/80 via-white to-[#e8eef5] px-4 py-16",
    overlay:
      "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(10,22,40,0.06),transparent_50%)]",
    card:
      "relative w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50",
    eyebrow: "text-xs font-semibold uppercase tracking-wider text-[#0a1628]",
    title: "mt-2 text-2xl font-semibold tracking-tight text-slate-900",
    description: "mt-2 text-sm text-slate-600",
    footerHint: "mt-6 text-center text-xs text-slate-500",
    contactLink: "font-medium text-[#0d4f6e] hover:text-[#0a1628] hover:underline",
    label: "text-sm font-medium text-slate-700",
    input:
      "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/15",
    select:
      "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/15",
    submit:
      "w-full rounded-lg bg-[#0a1628] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152a45] disabled:cursor-not-allowed disabled:opacity-60",
    demoNote: "text-center text-xs text-slate-500",
    errorBox: "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100",
  },
};

export type ApplyFormTheme = {
  sectionBorder: string;
  sectionTitle: string;
  label: string;
  input: string;
  fileInput: string;
  fileHint: string;
  submit: string;
  errorBox: string;
  successBox: string;
};

export const APPLY_FORM_THEME: Record<CompanyId, ApplyFormTheme> = {
  aemg: {
    sectionBorder: "border-b border-slate-200 pb-2",
    sectionTitle: "text-base font-semibold text-slate-900",
    label: "text-sm font-medium text-slate-700",
    input:
      "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20",
    fileInput:
      "block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#E8961E]/15 file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#c9790e] hover:file:bg-[#E8961E]/25",
    fileHint: "text-xs text-slate-500",
    submit:
      "rounded-lg bg-[#E8961E] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d1841a] disabled:cursor-not-allowed disabled:opacity-60",
    errorBox:
      "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100",
    successBox:
      "rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-emerald-900",
  },
  aife: {
    sectionBorder: "border-b border-slate-200 pb-2",
    sectionTitle: "text-base font-semibold text-slate-900",
    label: "text-sm font-medium text-slate-700",
    input:
      "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/15",
    fileInput:
      "block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#0a1628]/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#0a1628] hover:file:bg-[#0a1628]/15",
    fileHint: "text-xs text-slate-500",
    submit:
      "rounded-lg bg-[#0a1628] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152a45] disabled:cursor-not-allowed disabled:opacity-60",
    errorBox:
      "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100",
    successBox:
      "rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-emerald-900",
  },
};

export function getPortalTheme(company: CompanyId): PortalTheme {
  return PORTAL_THEME[company];
}

export function getLoginTheme(company: CompanyId): LoginTheme {
  return LOGIN_THEME[company];
}

export function getApplyFormTheme(company: CompanyId): ApplyFormTheme {
  return APPLY_FORM_THEME[company];
}
