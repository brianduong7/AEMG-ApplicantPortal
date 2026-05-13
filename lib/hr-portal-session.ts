import { redirect } from "next/navigation";
import { getSession, isHrPortal } from "@/lib/session";

export async function requireHrPortalSession() {
  const session = await getSession();
  if (!session || !isHrPortal(session)) {
    redirect(`/hr-portal/login?company=${session?.company ?? "aemg"}`);
  }
  return session;
}
