import { StaffMinimalPortalShell } from "@/components/staff-minimal-portal-shell";
import { requireDepartmentManagerSession } from "@/lib/department-manager-session";

export default async function DepartmentManagerPortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireDepartmentManagerSession();

  return (
    <StaffMinimalPortalShell
      title="Department manager portal"
      email={session.email}
      companyId={session.company}
    >
      {children}
    </StaffMinimalPortalShell>
  );
}
