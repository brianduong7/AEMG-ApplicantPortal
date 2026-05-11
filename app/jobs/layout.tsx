import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { COMPANIES } from "@/lib/companies";
import { getPortalTheme } from "@/lib/portal-theme";
import { getSession } from "@/lib/session";

export default async function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const theme = getPortalTheme(session.company);
  const brand = COMPANIES[session.company];

  return (
    <div className={theme.shell}>
      <header className={theme.header}>
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/jobs"
            className={`flex min-w-0 items-center gap-3 ${theme.headerLink}`}
          >
            <Image
              src={brand.logoSrc}
              alt={brand.shortLabel}
              width={140}
              height={40}
              className="h-8 w-auto shrink-0 object-contain"
            />
            <span className="truncate font-semibold">Applicant portal</span>
          </Link>
          <div className="relative shrink-0 text-sm">
            <details className="group">
              <summary className="list-none cursor-pointer rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-50">
                <span className="sr-only">Open profile menu</span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="12" cy="8" r="3.2" />
                  <path d="M5 19c1.4-3.2 4-4.8 7-4.8s5.6 1.6 7 4.8" />
                </svg>
              </summary>
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="font-medium text-slate-900">{session.email}</p>
                  <p className="text-xs text-slate-500">{brand.shortLabel}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/jobs/profile"
                    className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50"
                  >
                    My info
                  </Link>
                  <Link
                    href="/jobs/applications"
                    className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50"
                  >
                    My applications
                  </Link>
                </div>
                <div className="border-t border-slate-100 pt-1">
                  <form action={logout}>
                    <button type="submit" className={`${theme.signOutButton} w-full`}>
                      Sign out
                    </button>
                  </form>
                </div>
              </div>
            </details>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </div>
    </div>
  );
}
