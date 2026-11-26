export const ROUTE_PATHS = {
  home: "/",
  login: "/login",
  register: "/register",
  studentRegister: "/register/student",
  teacherRegister: "/register/teacher",
  verifyEmail: "/verify-email",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  deviceBlocked: "/device-blocked",
  teacherPending: "/teacher/pending",
  accountSuspended: "/account-suspended",
  student: "/student",
  studentTeachers: "/student/teachers",
  studentTeacherDetail: "/student/teachers/:teacherId",
  studentCheckout: "/student/checkout/:productId",
  studentPurchases: "/student/purchases",
  studentPurchaseDetail: "/student/purchases/:orderId",
  teacher: "/teacher",
  teacherCourse: "/teacher/courses/:courseId",
  teacherLessonNew: "/teacher/courses/:courseId/lessons/new",
  teacherLessonEdit: "/teacher/courses/:courseId/lessons/:lessonId",
  admin: "/admin",
  adminAcademic: "/admin/academic",
  adminTeachers: "/admin/teachers",
  adminOrders: "/admin/orders",
  adminOrderDetail: "/admin/orders/:orderId",
  adminManualOrder: "/admin/orders/new",
  adminTeacherApplication: "/admin/teachers/applications/:applicationId",
  notFound: "/not-found",
  uiGallery: "/__ui",
  catchAll: "*",
} as const;

/** Builds a teacher discovery detail path while preserving current list parameters. */
export function getStudentTeacherPath(teacherId: string, search = ""): string {
  const path = ROUTE_PATHS.studentTeacherDetail.replace(
    ":teacherId",
    encodeURIComponent(teacherId),
  );
  return search ? `${path}?${search}` : path;
}

/** Builds the lazy checkout placeholder path for a product identifier. */
export function getStudentCheckoutPath(productId: string): string {
  return ROUTE_PATHS.studentCheckout.replace(":productId", encodeURIComponent(productId));
}

/** Builds the student purchase history route. */
export function getStudentPurchasesPath(): string {
  return ROUTE_PATHS.studentPurchases;
}

/** Builds a student purchase detail route for an opaque order identifier. */
export function getStudentPurchasePath(orderId: string): string {
  return ROUTE_PATHS.studentPurchaseDetail.replace(":orderId", encodeURIComponent(orderId));
}

/** Builds the admin order detail route for an opaque order identifier. */
export function getAdminOrderPath(orderId: string): string {
  return ROUTE_PATHS.adminOrderDetail.replace(":orderId", encodeURIComponent(orderId));
}

/** Builds the teacher course route for an opaque course identifier. */
export function getTeacherCoursePath(courseId: string): string {
  return ROUTE_PATHS.teacherCourse.replace(":courseId", encodeURIComponent(courseId));
}

/** Builds the new teacher lesson route for a course identifier. */
export function getNewTeacherLessonPath(courseId: string): string {
  return ROUTE_PATHS.teacherLessonNew.replace(":courseId", encodeURIComponent(courseId));
}

/** Builds an existing teacher lesson route for course and lesson identifiers. */
export function getTeacherLessonPath(courseId: string, lessonId: string): string {
  return ROUTE_PATHS.teacherLessonEdit
    .replace(":courseId", encodeURIComponent(courseId))
    .replace(":lessonId", encodeURIComponent(lessonId));
}
