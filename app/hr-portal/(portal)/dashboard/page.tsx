import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — HR portal",
};

export default async function HrPortalDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
      <p className="max-w-xl text-sm text-slate-600">
        This area is for broader HR operations (policy, compliance, org-wide reporting). The{" "}
        <strong>recruiter portal</strong> remains the place for job openings, applicants, and
        interviews. Extend this dashboard when you connect HRIS or ERPNext HR modules.
      </p>
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        No widgets yet
      </div>
    </div>
  );
}
