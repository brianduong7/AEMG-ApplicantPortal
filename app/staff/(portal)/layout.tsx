import { StaffPortalShell } from "@/components/staff-portal-shell";
import { StaffSessionSync } from "@/components/staff-session-sync";
import { getEffectiveStaffPortalRoles } from "@/lib/staff-roles";
import { requireStaffSession } from "@/lib/staff-session";

export default async function StaffPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireStaffSession();
  const roles = await getEffectiveStaffPortalRoles(session);

  return (
    <StaffPortalShell email={session.email} roles={roles}>
      <StaffSessionSync />
      {children}
    </StaffPortalShell>
  );
}
