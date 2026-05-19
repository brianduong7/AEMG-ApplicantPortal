/** URL slug from a job title (AEMG-style: senior-compliance-policy-manager). */
export function slugifyJobTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Assign unique slugs when multiple openings share the same title slug. */
export function assignUniqueCareerSlugs<T extends { id: string; title: string }>(
  jobs: T[],
): Array<T & { slug: string }> {
  const seen = new Map<string, number>();
  return jobs.map((job) => {
    const base = slugifyJobTitle(job.title) || slugifyJobTitle(job.id) || job.id.toLowerCase();
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const slug = count === 0 ? base : `${base}-${count + 1}`;
    return { ...job, slug };
  });
}
