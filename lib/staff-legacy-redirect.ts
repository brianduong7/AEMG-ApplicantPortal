/**
 * Maps legacy portal URL paths to the unified `/staff` tree. Returns null when the path should
 * not be rewritten (e.g. sign-in pages).
 */
export function legacyStaffUrlRedirect(pathname: string): string | null {
  const isLoginOrRegister = (login: string, register?: string) =>
    pathname === login ||
    pathname.startsWith(`${login}/`) ||
    (register ?
      pathname === register || pathname.startsWith(`${register}/`)
    : false);

  if (isLoginOrRegister("/recruiter/login", "/recruiter/register")) return null;
  if (isLoginOrRegister("/department-manager/login")) return null;
  if (isLoginOrRegister("/hr-portal/login")) return null;

  if (pathname === "/recruiter" || pathname.startsWith("/recruiter/")) {
    const rest = pathname.slice("/recruiter".length);
    return rest === "" || rest === "/" ? "/staff/dashboard" : `/staff${rest}`;
  }
  if (pathname === "/department-manager" || pathname.startsWith("/department-manager/")) {
    const rest = pathname.slice("/department-manager".length);
    return rest === "" || rest === "/" ? "/staff/dashboard" : `/staff${rest}`;
  }
  if (pathname === "/hr-portal" || pathname.startsWith("/hr-portal/")) {
    const rest = pathname.slice("/hr-portal".length);
    return rest === "" || rest === "/" ? "/staff/dashboard" : `/staff${rest}`;
  }
  return null;
}
