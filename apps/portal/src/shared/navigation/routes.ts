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
  studentLessons: "/student/lessons",
  studentLessonDetail: "/student/lessons/:lessonId",
  studentLessonQuiz: "/student/lessons/:lessonId/quiz",
  studentTeacherDetail: "/student/teachers/:teacherId",
  studentCheckout: "/student/checkout/:productId",
  studentPurchases: "/student/purchases",
  studentPurchaseDetail: "/student/purchases/:orderId",
  teacher: "/teacher",
  teacherQuestions: "/teacher/questions",
  teacherAssessmentNew: "/teacher/courses/:courseId/assessments/new/:type",
  teacherAssessmentEdit: "/teacher/courses/:courseId/assessments/:assessmentId/edit",
  teacherAssessmentResults: "/teacher/courses/:courseId/assessments/:assessmentId/results",
  teacherAssessmentAttempt:
    "/teacher/courses/:courseId/assessments/:assessmentId/results/:attemptId",
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

/** Builds a student lesson detail path for an opaque lesson identifier. */
export function getStudentLessonPath(lessonId: string): string {
  return ROUTE_PATHS.studentLessonDetail.replace(":lessonId", encodeURIComponent(lessonId));
}

/** Builds the student teacher detail destination for an opaque teacher identifier. */
export function getStudentTeacherBrowsePath(teacherId: string): string {
  return ROUTE_PATHS.studentTeacherDetail.replace(":teacherId", encodeURIComponent(teacherId));
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

/** Builds the result list route for an assessment owned by a teacher's course.
 * @param courseId Teacher-owned course identifier.
 * @param assessmentId Assessment identifier.
 */
export function getTeacherAssessmentResultsPath(courseId: string, assessmentId: string): string {
  return ROUTE_PATHS.teacherAssessmentResults
    .replace(":courseId", encodeURIComponent(courseId))
    .replace(":assessmentId", encodeURIComponent(assessmentId));
}

/** Builds a frozen attempt detail route under its assessment results.
 * @param courseId Teacher-owned course identifier.
 * @param assessmentId Assessment identifier.
 * @param attemptId Attempt identifier.
 */
export function getTeacherAssessmentAttemptPath(
  courseId: string,
  assessmentId: string,
  attemptId: string,
): string {
  return `${getTeacherAssessmentResultsPath(courseId, assessmentId)}/${encodeURIComponent(attemptId)}`;
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
