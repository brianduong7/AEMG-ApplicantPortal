/**
 * Desk Role names on the User (must match ERPNext Role master exactly).
 */
export const ERP_STAFF_ROLE_NAMES = {
  recruiter: "D-Recruiter",
  hr: "D-HR",
  departmentManager: "D-Department Manager",
  executive: "D-Executive",
} as const;

export type StaffErpRole = "d_recruiter" | "d_hr" | "d_department_manager" | "d_executive";

const ERP_NAME_TO_KEY: Record<string, StaffErpRole> = {
  [ERP_STAFF_ROLE_NAMES.recruiter]: "d_recruiter",
  [ERP_STAFF_ROLE_NAMES.hr]: "d_hr",
  [ERP_STAFF_ROLE_NAMES.departmentManager]: "d_department_manager",
  [ERP_STAFF_ROLE_NAMES.executive]: "d_executive",
};

export function parseStaffErpRoleFromErpName(raw: string): StaffErpRole | null {
  const t = raw.trim();
  if (ERP_NAME_TO_KEY[t]) return ERP_NAME_TO_KEY[t];
  const lower = t.toLowerCase();
  for (const [erpName, key] of Object.entries(ERP_NAME_TO_KEY)) {
    if (erpName.toLowerCase() === lower) return key;
  }
  return null;
}

/** Maps ERPNext Role Profile names (e.g. P-HR on the User) to portal roles. */
const ROLE_PROFILE_TO_STAFF: Record<string, StaffErpRole> = {
  "P-HR": "d_hr",
  "P-Recruiter": "d_recruiter",
  "P-Department Manager": "d_department_manager",
  "P-Executive": "d_executive",
};

export function parseStaffErpRoleFromRoleProfile(raw: string): StaffErpRole | null {
  const t = raw.trim();
  return ROLE_PROFILE_TO_STAFF[t] ?? null;
}

/** Resolve portal roles from desk Role names and/or Role Profile labels. */
export function staffErpRolesFromDeskAndProfileNames(names: string[]): StaffErpRole[] {
  const out: StaffErpRole[] = [];
  for (const name of names) {
    const keys = [
      parseStaffErpRoleFromErpName(name),
      parseStaffErpRoleFromRoleProfile(name),
    ];
    for (const key of keys) {
      if (key && !out.includes(key)) out.push(key);
    }
  }
  return out;
}

export function staffErpRoleLabels(roles: StaffErpRole[]): string {
  const labels: Record<StaffErpRole, string> = {
    d_recruiter: "Recruiter",
    d_hr: "HR",
    d_department_manager: "Department manager",
    d_executive: "Executive",
  };
  const unique = [...new Set(roles)];
  return unique.map((r) => labels[r]).join(", ");
}

export function staffRolesAllow(
  roles: StaffErpRole[],
  allowed: readonly StaffErpRole[],
): boolean {
  const set = new Set(allowed);
  return roles.some((r) => set.has(r));
}

/** Nav / route access groups used by the staff shell and `requireStaffRoles`. */
export type StaffPortalRole = StaffErpRole | "super_admin";

export function staffPortalRolesAllow(
  roles: StaffPortalRole[],
  allowed: readonly StaffPortalRole[],
): boolean {
  if (roles.includes("super_admin")) return true;
  return staffRolesAllow(
    roles.filter((r): r is StaffErpRole => r !== "super_admin"),
    allowed.filter((r): r is StaffErpRole => r !== "super_admin"),
  );
}

const STAFF_ERP_ROLE_KEYS: StaffErpRole[] = [
  "d_recruiter",
  "d_hr",
  "d_department_manager",
  "d_executive",
];

export function normalizeStaffErpRoles(raw: unknown): StaffErpRole[] {
  if (!Array.isArray(raw)) return [];
  const out: StaffErpRole[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const fromErp = parseStaffErpRoleFromErpName(item);
    if (fromErp && !out.includes(fromErp)) {
      out.push(fromErp);
      continue;
    }
    if (
      STAFF_ERP_ROLE_KEYS.includes(item as StaffErpRole) &&
      !out.includes(item as StaffErpRole)
    ) {
      out.push(item as StaffErpRole);
    }
  }
  return out;
}
