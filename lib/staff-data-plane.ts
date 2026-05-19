import type { SessionPayload } from "@/lib/session";
import {
  staffRolesFromSession,
  staffUseScopedDepartmentManagerDataPlane,
} from "@/lib/staff-roles";

/** Department managers use scoped ERPNext queries unless they also have a wider desk role. */
export function staffUseDepartmentManagerDataPlane(session: SessionPayload): boolean {
  return staffUseScopedDepartmentManagerDataPlane(staffRolesFromSession(session));
}
