import { RecruiterPortalShell } from "@/components/recruiter-portal-shell";
import { requireRecruiterSession } from "@/lib/recruiter-session";

export default async function RecruiterPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireRecruiterSession();

  return (
    <RecruiterPortalShell email={session.email} companyId={session.company}>
      {children}
    </RecruiterPortalShell>
  );
}
