import Image from "next/image";
import Link from "next/link";
import { PUBLIC_CAREERS_BRAND } from "@/lib/careers-site";

const NAV_LINKS = [
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "mailto:careers@aife.edu.au" },
] as const;

type Props = {
  variant?: "hero" | "light";
};

export function CareersNav({ variant = "hero" }: Props) {
  const onHero = variant === "hero";
  const linkClass = onHero
    ? "text-[11px] font-semibold uppercase tracking-wide text-white/90 transition hover:text-white"
    : "text-[11px] font-semibold uppercase tracking-wide text-slate-700 transition hover:text-slate-900";

  return (
    <header
      className={
        onHero ?
          "absolute inset-x-0 top-0 z-20 border-b border-white/10 bg-[#0a1628]/80 backdrop-blur-sm"
        : "border-b border-slate-200 bg-white"
      }
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/careers" className="flex shrink-0 items-center gap-2">
          <span className="inline-flex rounded-md bg-[#0a1628] px-2.5 py-1.5 ring-1 ring-white/10">
            <Image
              src={PUBLIC_CAREERS_BRAND.logoSrc}
              alt={PUBLIC_CAREERS_BRAND.shortLabel}
              width={140}
              height={48}
              className="h-8 w-auto max-w-[120px] object-contain"
              priority
            />
          </span>
        </Link>
        <nav className="hidden items-center justify-end gap-x-5 lg:flex" aria-label="Site">
          {NAV_LINKS.map((item) => (
            <Link key={item.label} href={item.href} className={linkClass}>
              {item.label}
            </Link>
          ))}
          <Link
            href={`/applicant/login?company=aife&intent=applicant`}
            className={`${linkClass} rounded border px-2.5 py-1 ${onHero ? "border-white/30" : "border-slate-300"}`}
          >
            Applicant portal
          </Link>
        </nav>
        <Link
          href={`/applicant/login?company=aife&intent=applicant`}
          className={`${linkClass} lg:hidden rounded border px-2 py-1 ${onHero ? "border-white/30" : "border-slate-300"}`}
        >
          Apply
        </Link>
      </div>
    </header>
  );
}
