import type { UserRole } from "./types/authTypes";

export type StaffRole = Exclude<UserRole, "PATIENT">;

const STAFF_HOME_PATHS: Record<StaffRole, string> = {
  ADMIN: "/doctors",
  DOCTOR: "/examinations",
  RECEPTIONIST: "/reception",
};

const STAFF_PATHS: Record<StaffRole, string[]> = {
  ADMIN: [
    "/overview",
    "/doctors",
    "/users",
    "/schedules",
    "/exceptions",
    "/audit-logs",
    "/settings",
    "/diagnostic-results",
  ],
  DOCTOR: ["/examinations", "/schedules/calendar", "/diagnostic-results"],
  RECEPTIONIST: ["/reception", "/queues", "/schedules/calendar", "/exceptions"],
};

export function isStaffRole(role: unknown): role is StaffRole {
  return role === "ADMIN" || role === "DOCTOR" || role === "RECEPTIONIST";
}

export function canAccessStaffPath(role: unknown, pathname: string): boolean {
  return (
    isStaffRole(role) &&
    STAFF_PATHS[role].some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  );
}

export function getPostLoginDestination(
  role: StaffRole,
  redirect?: string | null,
): string {
  if (
    redirect?.startsWith("/") &&
    !redirect.startsWith("//") &&
    !/[\\\u0000-\u001f\u007f]/.test(redirect)
  ) {
    const target = new URL(redirect, "https://mediconnect.invalid");
    if (
      target.origin === "https://mediconnect.invalid" &&
      canAccessStaffPath(role, target.pathname)
    ) {
      return `${target.pathname}${target.search}${target.hash}`;
    }
  }
  return STAFF_HOME_PATHS[role];
}
