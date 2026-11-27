import { useTranslation } from "react-i18next";
import { Alert, Button } from "@noldg/ui";
import type { StudentLesson } from "@noldg/api/contracts/learning";
import { getStudentLessonPath } from "../../../shared/navigation/routes";

/** Renders quiz navigation only when the server advertises it or reports completion.
 * @param props Lesson quiz contract and the server's active-session completion signal.
 */
export function LessonQuizEntry({
  lesson,
  serverThresholdReached,
}: {
  lesson: StudentLesson;
  serverThresholdReached: boolean;
}) {
  const { t } = useTranslation("learning");
  if (!(lesson.quiz.available || serverThresholdReached) || !lesson.quiz.id) return null;
  return (
    <Alert tone="success" title={t("lesson.quizReady")}>
      <Button to={`${getStudentLessonPath(lesson.id)}/quiz`} variant="primary">
        {t("lesson.openQuiz")}
      </Button>
    </Alert>
  );
}
