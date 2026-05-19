import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEPARTMENT_MANAGER_FRAPPE_COOKIE } from "@/lib/auth-constants";
import { getSession, isDepartmentManagerPortal } from "@/lib/session";

export async function requireDepartmentManagerSession() {
  const session = await getSession();
  if (!session || !isDepartmentManagerPortal(session)) {
    const jar = await cookies();
    const hasDmJar = Boolean(jar.get(DEPARTMENT_MANAGER_FRAPPE_COOKIE)?.value?.trim());
    const q = new URLSearchParams();
    q.set("company", session?.company ?? "aemg");
    if (hasDmJar && (!session || !isDepartmentManagerPortal(session))) {
      q.set("staleSession", "1");
    }
    redirect(`/staff/login?${q.toString()}`);
  }
  return session;
}
