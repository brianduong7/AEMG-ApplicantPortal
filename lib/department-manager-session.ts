import { redirect } from "next/navigation";
import { getSession, isDepartmentManagerPortal } from "@/lib/session";

export async function requireDepartmentManagerSession() {
  const session = await getSession();
  if (!session || !isDepartmentManagerPortal(session)) {
    redirect(`/department-manager/login?company=${session?.company ?? "aemg"}`);
  }
  return session;
}
