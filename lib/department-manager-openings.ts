import {
  fetchERPNextJobOpeningByDocName,
  fetchERPNextJobOpeningsForDepartmentManager,
  fetchERPNextJobOpeningsForRequisition,
  fetchERPNextJobRequisitionsForDepartmentManager,
} from "@/lib/erpnext";

async function openingIdsForDepartmentManager(managerUserId: string): Promise<Set<string>> {
  const ids = new Set<string>();
  const scoped = (await fetchERPNextJobOpeningsForDepartmentManager(managerUserId)) ?? [];
  for (const row of scoped) {
    if (row.name?.trim()) ids.add(row.name.trim());
  }

  const requisitions =
    (await fetchERPNextJobRequisitionsForDepartmentManager(managerUserId)) ?? [];
  for (const req of requisitions) {
    const reqName = req.name?.trim();
    if (!reqName) continue;
    const linked = (await fetchERPNextJobOpeningsForRequisition(reqName)) ?? [];
    for (const opening of linked) {
      if (opening.name?.trim()) ids.add(opening.name.trim());
    }
  }

  return ids;
}

export async function departmentManagerCanViewJobOpening(
  managerUserId: string,
  openingDocName: string,
): Promise<boolean> {
  const trimmed = openingDocName.trim();
  if (!trimmed) return false;
  const ids = await openingIdsForDepartmentManager(managerUserId);
  return ids.has(trimmed);
}

export async function loadJobOpeningForDepartmentManagerView(
  managerUserId: string,
  openingDocName: string,
): Promise<Awaited<ReturnType<typeof fetchERPNextJobOpeningByDocName>>> {
  const trimmed = openingDocName.trim();
  if (!trimmed) return null;
  const allowed = await departmentManagerCanViewJobOpening(managerUserId, trimmed);
  if (!allowed) return null;
  return fetchERPNextJobOpeningByDocName(trimmed);
}
