import { NextResponse } from "next/server";
import { fetchERPNextJobOfferTermTemplateRows } from "@/lib/erpnext";
import { getSession, isStaffPortalSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !isStaffPortalSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const name = new URL(request.url).searchParams.get("name")?.trim() ?? "";
  if (!name) {
    return NextResponse.json({ error: "Missing template name." }, { status: 400 });
  }

  const rows = await fetchERPNextJobOfferTermTemplateRows(name);
  if (!rows) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  return NextResponse.json({ offer_terms: rows });
}
