import type { Metadata } from "next";
import Link from "next/link";
import { InterviewsHubToolbar } from "@/components/interviews-hub-toolbar";
import {
  fetchERPNextInterviewsForDepartmentManagerOpenings,
  fetchERPNextInterviewsForHr,
  fetchERPNextInterviewRounds,
  fetchERPNextJobOpeningsForDepartmentManager,
  hasERPNextConfig,
} from "@/lib/erpnext";
import { readStaffFrappeCookieHeader } from "@/lib/staff-erpnext-session";
import { staffUseDepartmentManagerDataPlane } from "@/lib/staff-data-plane";
import { staffHasRecruiterCapabilities, staffRolesFromSession } from "@/lib/staff-roles";
import { requireStaffRoles } from "@/lib/staff-session";

export const metadata: Metadata = {
  title: "Interviews — Staff",
};

export default async function StaffInterviewsPage() {
  const { session, roles } = await requireStaffRoles([
    "d_recruiter",
    "d_hr",
    "d_executive",
    "super_admin",
  ]);
  const canManage = staffHasRecruiterCapabilities(roles);
  const isDm = staffUseDepartmentManagerDataPlane(session);

  if (!hasERPNextConfig()) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Interviews</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-600">
          Recruitment backend is not configured. Contact your administrator.
        </p>
      </div>
    );
  }

  const frappeCookie = await readStaffFrappeCookieHeader();
  const usesRound = (await fetchERPNextInterviewRounds()) !== null;

  let rows: Awaited<ReturnType<typeof fetchERPNextInterviewsForHr>> = [];
  if (isDm) {
    const openings = (await fetchERPNextJobOpeningsForDepartmentManager(session.email)) ?? [];
    const openingIds = openings
      .map((o) => o.name)
      .filter((n): n is string => typeof n === "string" && n.length > 0);
    rows = (await fetchERPNextInterviewsForDepartmentManagerOpenings(openingIds)) ?? [];
  } else {
    rows = (await fetchERPNextInterviewsForHr({ frappeSessionCookie: frappeCookie })) ?? [];
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Interviews</h1>
          <p className="mt-1 text-sm text-slate-600">
            Plan interviews and capture recruiter notes. Meetings run in Microsoft Teams outside
            this app.
          </p>
        </div>
        <InterviewsHubToolbar canManage={canManage} />
      </div>

      {rows.length === 0 ?
        <div className="rounded-xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-slate-600">No interviews yet.</p>
          {canManage ?
            <p className="mt-3 text-sm text-slate-600">
              <Link href="/staff/interviews/new" className="font-medium text-[#0d4f6e] hover:underline">
                Create an interview
              </Link>
              {" "}or schedule one from an{" "}
              <Link href="/staff/applicants" className="font-medium text-[#0d4f6e] hover:underline">
                applicant
              </Link>
              .
            </p>
          : null}
        </div>
      : <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">{usesRound ? "Round" : "Type"}</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const id = row.name ?? "";
                const when =
                  [row.scheduled_on, row.from_time, row.to_time].filter(Boolean).join(" · ") || "—";
                const roundOrType = usesRound ? row.interview_round : row.interview_type;
                return (
                  <tr key={id || when} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      {row.job_applicant && id ?
                        <Link
                          href={`/staff/applicants/${encodeURIComponent(row.job_applicant)}`}
                          className="font-medium text-[#0d4f6e] hover:underline"
                        >
                          {row.job_applicant}
                        </Link>
                      : (
                        <span className="text-slate-800">{row.job_applicant ?? "—"}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{when}</td>
                    <td className="px-4 py-3 text-slate-600">{roundOrType ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                        {row.status ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {id ?
                        <Link
                          href={`/staff/interviews/${encodeURIComponent(id)}`}
                          className="font-medium text-[#0d4f6e] hover:underline"
                        >
                          View
                        </Link>
                      : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      }
    </div>
  );
}
