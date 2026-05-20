import Link from "next/link";
import { careerJobPath, type CareerJob } from "@/lib/careers";

type Props = {
  jobs: CareerJob[];
  currentSlug?: string;
};

function IconClock() {
  return (
    <svg className="h-3 w-3 shrink-0 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export function CareersRecentPosts({ jobs, currentSlug }: Props) {
  const items = jobs.filter((j) => j.slug !== currentSlug).slice(0, 5);
  if (items.length === 0) return null;

  return (
    <aside className="h-fit self-start rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm lg:sticky lg:top-6">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">Recent Posts</h2>
      <ul className="mt-4 space-y-4">
        {items.map((job) => (
          <li key={job.id}>
            <Link
              href={careerJobPath(job)}
              className="group block text-sm font-semibold leading-snug text-slate-900 transition hover:text-[#0d4f6e]"
            >
              {job.title}
            </Link>
            {job.postedAt ?
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <IconClock />
                {job.postedAt}
              </p>
            : null}
          </li>
        ))}
      </ul>
    </aside>
  );
}
