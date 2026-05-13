import { StaffMinimalPortalShell } from "@/components/staff-minimal-portal-shell";
import { requireHrPortalSession } from "@/lib/hr-portal-session";

export default async function HrPortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireHrPortalSession();

  return (
    <StaffMinimalPortalShell
      title="HR portal"
      email={session.email}
      companyId={session.company}
    >
      {children}
    </StaffMinimalPortalShell>
  );
}
