/** Builds the create route for a teacher course exam or homework. */
export function getTeacherAssessmentNewPath(courseId: string, type: "exam" | "homework"): string {
  return `/teacher/courses/${encodeURIComponent(courseId)}/assessments/new/${type}`;
}

/** Builds the result list route for an assessment owned by a teacher's course.
 * @param courseId Teacher-owned course identifier.
 * @param assessmentId Assessment identifier.
 */
export function getTeacherAssessmentResultsPath(courseId: string, assessmentId: string): string {
  return `/teacher/courses/${encodeURIComponent(courseId)}/assessments/${encodeURIComponent(assessmentId)}/results`;
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
