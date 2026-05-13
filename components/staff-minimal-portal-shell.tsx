import type { ReactNode } from "react";
import { logout } from "@/app/actions/auth";
import type { CompanyId } from "@/lib/companies";
import { COMPANIES } from "@/lib/companies";

type Props = {
  children: ReactNode;
  title: string;
  email: string;
  companyId: CompanyId;
};

export function StaffMinimalPortalShell({ children, title, email, companyId }: Props) {
  const brand = COMPANIES[companyId];

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-semibold text-slate-900">{title}</span>
          <span className="truncate text-xs text-slate-500">{brand.shortLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden max-w-[14rem] truncate text-sm text-slate-700 sm:inline">{email}</span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-6">{children}</main>
    </div>
  );
}
