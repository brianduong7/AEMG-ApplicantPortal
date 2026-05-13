import { redirect } from "next/navigation";
import { ApplicantPortalShell } from "@/components/applicant-portal-shell";
import {
  getSession,
  isApplicantPortal,
  isDepartmentManagerPortal,
  isHrPortal,
  isRecruiterPortal,
} from "@/lib/session";

export default async function ApplicantPortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (!session) {
    redirect("/applicant/login?intent=applicant");
  }
  if (!isApplicantPortal(session)) {
    if (isRecruiterPortal(session)) redirect("/recruiter/dashboard");
    if (isDepartmentManagerPortal(session)) redirect("/department-manager/dashboard");
    if (isHrPortal(session)) redirect("/hr-portal/dashboard");
    redirect("/applicant/login?intent=applicant");
  }

  return (
    <ApplicantPortalShell email={session.email} companyId={session.company}>
      {children}
    </ApplicantPortalShell>
  );
}
