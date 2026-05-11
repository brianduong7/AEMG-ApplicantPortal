import Image from "next/image";
import Link from "next/link";
import { COMPANIES, companyFromSearchParam } from "@/lib/companies";
import { getSession } from "@/lib/session";

type Props = {
  searchParams?: Promise<{ company?: string }>;
};

export default async function Home({ searchParams }: Props) {
  const session = await getSession();
  const sp = (await searchParams) ?? {};
  const selectedCompany = companyFromSearchParam(sp.company);
  const applicantHref = session
    ? "/jobs"
    : `/login?company=${encodeURIComponent(selectedCompany)}`;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-center gap-8 rounded-2xl border border-slate-200 bg-white px-6 py-5">
          {Object.values(COMPANIES).map((company) => (
            <Link
              key={company.id}
              href={`/?company=${encodeURIComponent(company.id)}`}
              className={`rounded-lg p-2 transition outline-none ring-offset-2 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400 ${
                company.id === selectedCompany ? "ring-2 ring-slate-400" : ""
              }`}
              aria-current={company.id === selectedCompany ? "true" : undefined}
            >
              <Image
                src={company.logoSrc}
                alt={`${company.shortLabel} logo`}
                width={160}
                height={52}
                className="h-10 w-auto object-contain"
                priority
              />
            </Link>
          ))}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Choose Portal</h1>
        <p className="mt-2 text-sm text-slate-600">
          Select the portal you want to access.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Link
            href={applicantHref}
            className="rounded-xl border border-slate-300 bg-white px-4 py-6 text-center text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-100"
          >
            Applicant Portal
          </Link>

          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-6 text-sm font-medium text-slate-500"
          >
            HR Portal
          </button>

          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-6 text-sm font-medium text-slate-500"
          >
            Recruiter Portal
          </button>
        </div>
      </div>
    </main>
  );
}
