import { NextResponse } from "next/server";
import { fetchApplicantApplicationForCandidate } from "@/lib/applications";
import { getApplicantCandidateStrict } from "@/lib/applicant-candidate";
import { fetchERPNextSiteFile, hasERPNextConfig } from "@/lib/erpnext";
import { getSession, isApplicantPortal } from "@/lib/session";

function filenameFromAttachment(ref: string): string {
  const path = ref.split("?")[0] ?? ref;
  const base = path.split("/").filter(Boolean).pop() ?? "resume";
  const safe = base.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 180);
  return safe || "resume";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || !isApplicantPortal(session)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!hasERPNextConfig()) {
    return new NextResponse("Recruitment backend is not configured.", { status: 503 });
  }

  const candidate = await getApplicantCandidateStrict();
  if (!candidate?.name) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;
  const applicationId = decodeURIComponent(id).trim();
  if (!applicationId) {
    return new NextResponse("Not found", { status: 404 });
  }

  const application = await fetchApplicantApplicationForCandidate(
    applicationId,
    candidate.name,
  );
  if (!application) {
    return new NextResponse("Not found", { status: 404 });
  }

  const attachment = application.resumeAttachment?.trim();
  if (!attachment) {
    return new NextResponse("No resume on file for this application.", { status: 404 });
  }

  const fetched = await fetchERPNextSiteFile(attachment);
  if (!fetched.ok || !fetched.body) {
    return new NextResponse("Could not load the file.", {
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
