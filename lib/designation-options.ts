import type { ERPNextDesignationRow } from "@/lib/erpnext";

export type DesignationOption = {
  name: string;
  label: string;
};

export function toDesignationOptions(
  rows: ERPNextDesignationRow[] | null | undefined,
): DesignationOption[] {
  return (rows ?? [])
    .map((r) => ({
      name: r.name,
      label: r.designation?.trim() || r.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
