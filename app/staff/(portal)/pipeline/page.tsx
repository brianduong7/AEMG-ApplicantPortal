import type { Metadata } from "next";
import { requireStaffRoles } from "@/lib/staff-session";

export const metadata: Metadata = {
  title: "Pipeline — Recruiter",
};

export default async function StaffPipelinePage() {
  await requireStaffRoles(["d_recruiter", "super_admin"]);
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Pipeline</h1>
      <p className="text-sm text-slate-600">
        Kanban, list, and report views for recruitment will surface here when connected to the system
        dashboards.
      </p>
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        Coming soon
      </div>
    </div>
  );
}
