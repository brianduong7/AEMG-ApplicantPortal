/** Normalize user or ERP time values to Frappe `Time` format (`HH:mm:ss`). */
export function normalizeErpTime(raw: string): string {
  const t = raw.trim();
  if (!t) throw new Error("Time is required.");

  const parts = t.split(":");
  if (parts.length < 2 || parts.length > 3) {
    throw new Error("Use a valid time (HH:mm or HH:mm:ss).");
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  const seconds = parts.length === 3 ? Number(parts[2]) : 0;

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    !Number.isFinite(seconds) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    throw new Error("Invalid time.");
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** `type="time"` inputs expect `HH:mm`. */
export function erpTimeToInputValue(raw?: string | null): string {
  const t = raw?.trim();
  if (!t) return "";
  try {
    return normalizeErpTime(t).slice(0, 5);
  } catch {
    const m = t.match(/^(\d{1,2}):(\d{2})/);
    return m ? `${m[1].padStart(2, "0")}:${m[2]}` : "";
  }
}
