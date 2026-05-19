import { NextResponse } from "next/server";
import { searchERPNextSystemUsersForPicker } from "@/lib/erpnext";
import { getSession, isRecruiterPortal } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !isRecruiterPortal(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const users = await searchERPNextSystemUsersForPicker(q);
  return NextResponse.json({ users });
}
