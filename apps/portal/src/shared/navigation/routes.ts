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
  teacher: "/teacher",
  teacherCourse: "/teacher/courses/:courseId",
  teacherLessonNew: "/teacher/courses/:courseId/lessons/new",
  teacherLessonEdit: "/teacher/courses/:courseId/lessons/:lessonId",
  admin: "/admin",
  adminAcademic: "/admin/academic",
  adminTeachers: "/admin/teachers",
  adminTeacherApplication: "/admin/teachers/applications/:applicationId",
  notFound: "/not-found",
  uiGallery: "/__ui",
  catchAll: "*",
} as const;

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
