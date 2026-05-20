import Image from "next/image";
import Link from "next/link";
import { PUBLIC_CAREERS_BRAND } from "@/lib/careers-site";

export function CareersFooter() {
  return (
    <footer className="bg-[#0a1628] text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-1">
          <span className="inline-flex rounded-md bg-white/5 px-2.5 py-1.5">
            <Image
              src={PUBLIC_CAREERS_BRAND.logoSrc}
              alt={PUBLIC_CAREERS_BRAND.shortLabel}
              width={160}
              height={56}
              className="h-10 w-auto max-w-[140px] object-contain"
            />
          </span>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Australia Institute of Future Education — shaping careers through quality education and
            meaningful opportunities.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Careers</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/careers" className="text-slate-400 transition hover:text-white">
                Current openings
              </Link>
            </li>
            <li>
              <Link
                href="/applicant/login?company=aife&intent=applicant"
                className="text-slate-400 transition hover:text-white"
              >
                Applicant sign in
              </Link>
            </li>
            <li>
              <Link
                href="/applicant/register?company=aife"
                className="text-slate-400 transition hover:text-white"
              >
                Create applicant account
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Contact</h3>
          <ul className="mt-3 space-y-3 text-sm text-slate-400">
            <li>
              <a href="mailto:careers@aife.edu.au" className="hover:text-white">
                careers@aife.edu.au
              </a>
            </li>
            <li>
              <Link href="/home" className="font-medium text-slate-300 hover:text-white">
                Recruitment portals →
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
        © {PUBLIC_CAREERS_BRAND.shortLabel} {new Date().getFullYear()}
      </div>
    </footer>
  );
}
