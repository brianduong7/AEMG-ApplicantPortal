import { NextResponse } from "next/server";
import { fetchERPNextSiteFile, hasERPNextConfig } from "@/lib/erpnext";
import { loadApplicantForDepartmentManagerPortal } from "@/lib/department-manager-applicants";
import { loadApplicantForRecruiterPortal } from "@/lib/recruiter-applicants";
import { getSession, isDepartmentManagerPortal, isRecruiterPortal } from "@/lib/session";

function filenameFromAttachment(ref: string): string {
  const path = ref.split("?")[0] ?? ref;
  const base = path.split("/").filter(Boolean).pop() ?? "resume";
  const safe = base.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 180);
  return safe || "resume";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ name: string }> },
) {
  const session = await getSession();
  const isDm = session && isDepartmentManagerPortal(session) && !isRecruiterPortal(session);
  const isRec = session && isRecruiterPortal(session);
  if (!session || (!isDm && !isRec)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!hasERPNextConfig()) {
    return new NextResponse("ERPNext is not configured.", { status: 503 });
  }

  const { name } = await context.params;
  const decoded = decodeURIComponent(name);

  const applicant = isDm ?
    await loadApplicantForDepartmentManagerPortal(decoded, session.email)
  : await loadApplicantForRecruiterPortal(decoded);
  if (!applicant?.name) {
    return new NextResponse("Not found", { status: 404 });
  }

  const attachment = applicant.resume_attachment?.trim();
  if (!attachment) {
    return new NextResponse("No resume on file for this applicant.", { status: 404 });
  }

  const fetched = await fetchERPNextSiteFile(attachment);
  if (!fetched.ok || !fetched.body) {
    return new NextResponse("Could not load the file from ERPNext.", {
      status: fetched.status >= 400 && fetched.status < 600 ? fetched.status : 502,
    });
  }

  const headers = new Headers();
  const ct = fetched.contentType?.split(";")[0]?.trim();
  if (ct && ct !== "text/html") {
    headers.set("Content-Type", ct);
  } else {
    headers.set("Content-Type", "application/octet-stream");
  }

  const filename = filenameFromAttachment(attachment);
  headers.set("Content-Disposition", `inline; filename="${filename.replace(/"/g, "")}"`);
  headers.set("Cache-Control", "private, no-store");

  return new NextResponse(fetched.body, { status: 200, headers });
}
