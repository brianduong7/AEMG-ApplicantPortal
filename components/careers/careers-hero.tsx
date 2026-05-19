import { CareersNav } from "@/components/careers/careers-nav";

type Props = {
  title: string;
  postedAt?: string | null;
  category?: string;
};

function IconCalendar() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconTag() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}

export function CareersHero({ title, postedAt, category = "Recruit" }: Props) {
  return (
    <section className="relative isolate min-h-[220px] overflow-hidden bg-slate-900 sm:min-h-[260px]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(15,23,42,0.85), rgba(30,41,59,0.75)), url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1600&q=80')",
        }}
        aria-hidden
      />
      <CareersNav variant="hero" />
      <div className="relative mx-auto flex max-w-6xl flex-col justify-end px-4 pb-10 pt-24 sm:px-6 sm:pb-12 sm:pt-28">
        <ul className="mb-3 flex flex-wrap items-center gap-4 text-xs text-white/85">
          {postedAt ?
            <li className="flex items-center gap-1.5">
              <IconCalendar />
              {postedAt}
            </li>
          : null}
          <li className="flex items-center gap-1.5">
            <IconTag />
            {category}
          </li>
        </ul>
        <h1 className="max-w-4xl text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl md:text-4xl">
          {title}
        </h1>
      </div>
    </section>
  );
}
