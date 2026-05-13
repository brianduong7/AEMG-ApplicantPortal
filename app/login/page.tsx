import { redirect } from "next/navigation";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy `/login` → applicant sign-in lives under `/applicant/login`. */
export default async function LegacyLoginRedirect({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") q.set(key, value);
  }
  const suffix = q.toString();
  redirect(suffix ? `/applicant/login?${suffix}` : "/applicant/login");
}
