import { NextResponse } from "next/server";
import { fetchERPNextTermsAndConditionsBody } from "@/lib/erpnext";
import { getSession, isStaffPortalSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !isStaffPortalSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const name = new URL(request.url).searchParams.get("name")?.trim() ?? "";
  if (!name) {
    return NextResponse.json({ error: "Missing document name." }, { status: 400 });
  }

  const terms = await fetchERPNextTermsAndConditionsBody(name);
  if (terms === null) {
    return NextResponse.json({ error: "Terms not found." }, { status: 404 });
  }

  return NextResponse.json({ terms });
}
