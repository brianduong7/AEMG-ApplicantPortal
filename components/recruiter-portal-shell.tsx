"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import type { CompanyId } from "@/lib/companies";
import { COMPANIES } from "@/lib/companies";
import { hrGreetingNameFromEmail } from "@/lib/hr-display-name";
import type { RecruiterShellTheme } from "@/lib/recruiter-shell-theme";
import { getRecruiterShellTheme } from "@/lib/recruiter-shell-theme";

type NavLinkItem = {
  href: string;
  label: string;
  match: (path: string) => boolean;
  icon: ReactNode;
};

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconBriefcase({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function IconHelp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 2-3 4M12 17h.01" />
    </svg>
  );
}

function IconLogout({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function IconChevron({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

const NAV_LINKS: NavLinkItem[] = [
  {
    href: "/recruiter/dashboard",
    label: "Dashboard",
    match: (p) => p === "/recruiter" || p === "/recruiter/dashboard",
    icon: <IconDashboard className="h-5 w-5 shrink-0" />,
  },
  {
    href: "/recruiter/openings",
    label: "Job openings",
    match: (p) => p.startsWith("/recruiter/openings"),
    icon: <IconBriefcase className="h-5 w-5 shrink-0" />,
  },
  {
    href: "/recruiter/applicants",
    label: "Job applicants",
    match: (p) => p.startsWith("/recruiter/applicants"),
    icon: <IconUsers className="h-5 w-5 shrink-0" />,
  },
  {
    href: "/recruiter/interviews",
    label: "Interviews",
    match: (p) => p.startsWith("/recruiter/interviews"),
    icon: <IconCalendar className="h-5 w-5 shrink-0" />,
  },
];

function SidebarDisabledRow({ label, icon, rowClass }: { label: string; icon: ReactNode; rowClass: string }) {
  return (
    <div className={rowClass}>
      <span className="shrink-0 opacity-70">{icon}</span>
      {label}
    </div>
  );
}

function SidebarNavLinks({
  pathname,
  onNavigate,
  theme,
}: {
  pathname: string;
  onNavigate?: () => void;
  theme: RecruiterShellTheme;
}) {
  return (
    <>
      {NAV_LINKS.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg py-2.5 pl-3 pr-3 text-sm transition ${
              active ? theme.navLinkActive : theme.navLinkInactive
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
      <SidebarDisabledRow
        label="Notifications"
        rowClass={theme.disabledRow}
        icon={<IconBell className="h-5 w-5 shrink-0" />}
      />
      <SidebarDisabledRow
        label="Settings"
        rowClass={theme.disabledRow}
        icon={<IconSettings className="h-5 w-5 shrink-0" />}
      />
    </>
  );
}

type Props = {
  children: React.ReactNode;
  email: string;
  companyId: CompanyId;
};

export function RecruiterPortalShell({ children, email, companyId }: Props) {
  const pathname = usePathname() ?? "";
  const brand = COMPANIES[companyId];
  const t = getRecruiterShellTheme(companyId);
  const greeting = hrGreetingNameFromEmail(email);
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-dvh">
      {navOpen ?
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
        />
      : null}

      <aside
        className={`${t.asideOuter} bg-white ${
          navOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <Link
          href="/recruiter/dashboard"
          onClick={() => setNavOpen(false)}
          className={t.logoStrip}
        >
          <Image
            src={brand.logoSrc}
            alt={brand.shortLabel}
            width={520}
            height={140}
            className="h-auto w-full object-contain"
            sizes="260px"
            priority
          />
        </Link>

        <div className={t.sidebarBody}>
          <nav className="flex flex-1 flex-col space-y-0.5 overflow-y-auto px-3 py-4">
            <SidebarNavLinks pathname={pathname} onNavigate={() => setNavOpen(false)} theme={t} />
          </nav>

          <div className={t.footerBar}>
            <SidebarDisabledRow
              label="Help center"
              rowClass={t.disabledRow}
              icon={<IconHelp className="h-5 w-5 shrink-0" />}
            />
            <form action={logout}>
              <button type="submit" className={t.logoutButton}>
                <IconLogout className="h-5 w-5 shrink-0 opacity-80" />
                Log out
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className={t.mainColumn}>
        <header className={t.headerBar}>
          <button
            type="button"
            className={t.mobileMenuBtn}
            aria-label="Open menu"
            onClick={() => setNavOpen(true)}
          >
            <IconMenu className="h-6 w-6" />
          </button>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <button type="button" className={t.notifyBtn} aria-label="Notifications">
              <IconBell className="h-5 w-5" />
              <span className={t.notifyBadge}>3</span>
            </button>
            <div className={t.profileChip}>
              <span className={t.profileAvatar}>{greeting.slice(0, 1)}</span>
              <span className="max-w-[12rem] truncate text-sm font-medium text-slate-800">
                Hello, {greeting}
              </span>
              <IconChevron className="hidden h-4 w-4 shrink-0 text-slate-400 sm:block" />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
