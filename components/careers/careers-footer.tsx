import Image from "next/image";
import Link from "next/link";
import { COMPANIES } from "@/lib/companies";

const AEMG_LINKS = [
  "About Us",
  "Governance",
  "Conference & Events",
  "News",
  "Partnership",
  "Career",
  "Privacy Statement",
  "Disclaimer",
] as const;

const EDUCATION_LINKS = [
  "AEMG Academy",
  "Australia Institute of Future Education (AIFE)",
  "Australian Institute of Higher and Further Education (AIHFE)",
] as const;

const RESEARCH_LINKS = ["AEMG Research", "Publications"] as const;

export function CareersFooter() {
  return (
    <footer className="bg-[#1a2332] text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:gap-6">
        <div className="sm:col-span-2 lg:col-span-1">
          <Image
            src={COMPANIES.aemg.logoSrc}
            alt="AEMG"
            width={160}
            height={56}
            className="h-10 w-auto brightness-0 invert"
          />
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Join us on a journey towards a mutually beneficial and prosperous future, as we redefine
            the landscape of global education through innovation and excellence.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">AEMG</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {AEMG_LINKS.map((label) => (
              <li key={label}>
                <span className="text-slate-400">{label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Education</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            {EDUCATION_LINKS.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Research</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            {RESEARCH_LINKS.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Contact</h3>
          <ul className="mt-3 space-y-3 text-sm text-slate-400">
            <li>635 Canterbury Road, Surrey Hills, VIC, 3127</li>
            <li>
              <a href="mailto:enquiries@aemg.com.au" className="hover:text-white">
                enquiries@aemg.com.au
              </a>
            </li>
            <li>
              <Link href="/home" className="font-medium text-slate-300 hover:text-white">
                AEMG recruitment portal →
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
        @AEMG {new Date().getFullYear()}
      </div>
    </footer>
  );
}
