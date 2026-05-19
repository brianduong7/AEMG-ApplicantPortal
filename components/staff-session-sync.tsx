"use client";

import { useEffect, useRef } from "react";

/** Once per mount, refresh staff roles in the session cookie from ERPNext. */
export function StaffSessionSync() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void fetch("/api/staff/session", { method: "POST", credentials: "include" });
  }, []);

  return null;
}
