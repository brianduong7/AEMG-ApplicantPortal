import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Department manager",
};

export default async function DepartmentManagerDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
      <p className="max-w-xl text-sm text-slate-600">
        This portal is ready for department-level workflows (headcount, approvals, team hiring
        views). Connect ERPNext or internal APIs here when you are ready to go beyond the demo
        shell.
      </p>
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        No widgets yet
      </div>
    </div>
  );
}
