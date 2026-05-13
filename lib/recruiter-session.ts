import { redirect } from "next/navigation";
import { getSession, isRecruiterPortal } from "@/lib/session";

export async function requireRecruiterSession() {
  const session = await getSession();
  if (!session || !isRecruiterPortal(session)) {
    redirect(`/recruiter/login?company=${session?.company ?? "aemg"}`);
  }
  return session;
}
