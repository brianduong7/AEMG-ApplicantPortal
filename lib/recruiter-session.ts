import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RECRUITER_FRAPPE_COOKIE } from "@/lib/auth-constants";
import { getSession, isRecruiterPortal } from "@/lib/session";

export async function requireRecruiterSession() {
  const session = await getSession();
  if (!session || !isRecruiterPortal(session)) {
    const jar = await cookies();
    const hasRecruiterJar = Boolean(jar.get(RECRUITER_FRAPPE_COOKIE)?.value?.trim());
    const q = new URLSearchParams();
    if (hasRecruiterJar && (!session || !isRecruiterPortal(session))) {
      q.set("staleSession", "1");
    }
    const qs = q.toString();
    redirect(qs ? `/staff/login?${qs}` : "/staff/login");
  }
  return session;
}
