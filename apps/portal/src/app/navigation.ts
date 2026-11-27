import type { IconName } from "@noldg/ui";
import type { PortalRole } from "../shared/auth/auth-store";
import { ROUTE_PATHS } from "../shared/navigation/routes";

export interface NavigationItem {
  id: string;
  icon: IconName;
  labelKey:
    | "navigation.studentHome"
    | "navigation.studentTeachers"
    | "navigation.teacherHome"
    | "navigation.adminHome"
    | "navigation.academic"
    | "navigation.teachers"
    | "navigation.studentPurchases"
    | "navigation.adminOrders"
    | "navigation.studentLessons"
    | "navigation.teacherQuestionBank";
  route: string;
  allowedRoles: readonly PortalRole[];
  enabled: boolean;
}

const adminRoles = ["admin", "super_admin"] as const;

const navigationItems: readonly NavigationItem[] = [
  {
    id: "student-teachers",
    icon: "users",
    labelKey: "navigation.studentTeachers",
    route: ROUTE_PATHS.studentTeachers,
    allowedRoles: ["student"],
    enabled: true,
  },
  {
    id: "student-home",
    icon: "home",
    labelKey: "navigation.studentHome",
    route: ROUTE_PATHS.student,
    allowedRoles: ["student"],
    enabled: true,
  },
  {
    id: "student-lessons",
    icon: "video",
    labelKey: "navigation.studentLessons",
    route: ROUTE_PATHS.studentLessons,
    allowedRoles: ["student"],
    enabled: true,
  },
  {
    id: "student-purchases",
    icon: "wallet",
    labelKey: "navigation.studentPurchases",
    route: ROUTE_PATHS.studentPurchases,
    allowedRoles: ["student"],
    enabled: true,
  },
  {
    id: "teacher-home",
    icon: "home",
    labelKey: "navigation.teacherHome",
    route: ROUTE_PATHS.teacher,
    allowedRoles: ["teacher"],
    enabled: true,
  },
  {
    id: "teacher-question-bank",
    icon: "book",
    labelKey: "navigation.teacherQuestionBank",
    route: ROUTE_PATHS.teacherQuestions,
    allowedRoles: ["teacher"],
    enabled: true,
  },
  {
    id: "admin-home",
    icon: "home",
    labelKey: "navigation.adminHome",
    route: ROUTE_PATHS.admin,
    allowedRoles: adminRoles,
    enabled: true,
  },
  {
    id: "admin-academic",
    icon: "book",
    labelKey: "navigation.academic",
    route: ROUTE_PATHS.adminAcademic,
    allowedRoles: adminRoles,
    enabled: true,
  },
  {
    id: "admin-teachers",
    icon: "users",
    labelKey: "navigation.teachers",
    route: ROUTE_PATHS.adminTeachers,
    allowedRoles: adminRoles,
    enabled: true,
  },
  {
    id: "admin-orders",
    icon: "wallet",
    labelKey: "navigation.adminOrders",
    route: ROUTE_PATHS.adminOrders,
    allowedRoles: adminRoles,
    enabled: true,
  },
];

/** Selects enabled navigation entries assigned to the current user role.
 * @param role Authenticated user's role.
 * @returns Allowed navigation entries in display order.
 */
export function getNavigationForRole(role: PortalRole): readonly NavigationItem[] {
  return navigationItems.filter((item) => item.enabled && item.allowedRoles.includes(role));
}
