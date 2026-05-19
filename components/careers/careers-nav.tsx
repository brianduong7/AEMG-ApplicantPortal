import Image from "next/image";
import Link from "next/link";
import { COMPANIES } from "@/lib/companies";

const NAV_LINKS = [
  { label: "Home", href: "/careers" },
  { label: "About", href: "#" },
  { label: "Partnerships", href: "#" },
  { label: "Education", href: "#" },
  { label: "Research", href: "#" },
  { label: "Publications", href: "#" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "#" },
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
          "absolute inset-x-0 top-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur-sm"
        : "border-b border-slate-200 bg-white"
      }
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/careers" className="flex shrink-0 items-center gap-2">
          <Image
            src={COMPANIES.aemg.logoSrc}
            alt="AEMG"
            width={140}
            height={48}
            className="h-9 w-auto object-contain brightness-0 invert"
            priority
          />
        </Link>
        <nav className="hidden flex-wrap items-center justify-end gap-x-4 gap-y-1 lg:flex" aria-label="Site">
          {NAV_LINKS.map((item) => (
            <Link key={item.label} href={item.href} className={linkClass}>
              {item.label}
            </Link>
          ))}
          <Link
            href="/home"
            className={`${linkClass} rounded border border-white/30 px-2 py-0.5 ${onHero ? "" : "border-slate-300"}`}
          >
            AEMG Portal
          </Link>
        </nav>
        <Link
          href="/home"
          className={`${linkClass} lg:hidden rounded border px-2 py-1 ${onHero ? "border-white/30" : "border-slate-300"}`}
        >
          Portal
        </Link>
      </div>
    </header>
  );
}
