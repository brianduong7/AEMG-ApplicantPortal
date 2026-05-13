import type { Metadata } from "next";
import Link from "next/link";
import { OpeningForm } from "@/components/opening-form";
import { requireRecruiterSession } from "@/lib/recruiter-session";
import { hasERPNextConfig } from "@/lib/erpnext";

export const metadata: Metadata = {
  title: "New job opening — Recruiter",
};

export default async function RecruiterNewOpeningPage() {
  await requireRecruiterSession();

  if (!hasERPNextConfig()) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">New opening</h1>
        <p className="mt-2 text-sm text-slate-600">Configure ERPNext environment variables first.</p>
        <Link href="/recruiter/openings" className="mt-4 inline-block text-sm font-medium text-slate-900 underline">
          ← Back to openings
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/recruiter/openings" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          ← Job openings
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">New job opening</h1>
        <p className="mt-1 text-sm text-slate-600">
          Creates a document in ERPNext via{" "}
          <code className="rounded bg-slate-100 px-1">POST /api/resource/Job Opening</code>.
        </p>
      </div>
      <OpeningForm mode="create" />
    </div>
  );
}
