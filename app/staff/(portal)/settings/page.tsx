import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings — Recruiter",
};

export default function RecruiterSettingsPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
      <p className="text-sm text-slate-600">
        Portal preferences and ERPNext connection details will live here when you add them.
      </p>
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        Coming soon
      </div>
    </div>
  );
}
