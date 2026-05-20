import Link from "next/link";
import { applicantLoginHref, PUBLIC_CAREERS_BRAND } from "@/lib/careers-site";

type Props = {
  jobId: string;
  jobTitle: string;
};

export function CareersApplyCta({ jobId, jobTitle }: Props) {
  const applyHref = applicantLoginHref(jobId);

  return (
    <section className="shrink-0 border-t border-slate-200 bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-xl font-bold text-slate-900">Ready to apply?</h2>
        <p className="mt-2 text-sm text-slate-600">
          Apply for <strong className="font-semibold text-slate-800">{jobTitle}</strong> at{" "}
          {PUBLIC_CAREERS_BRAND.shortLabel}. Sign in or create an applicant account to submit your
          application and track your progress.
        </p>
        <div className="mt-8">
          <Link
            href={applyHref}
            className="inline-flex min-w-[12rem] items-center justify-center rounded-lg bg-[#0a1628] px-10 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0d2847]"
          >
            Apply now
          </Link>
        </div>
      </div>
    </section>
  );
}
