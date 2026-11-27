import { useTranslation } from "react-i18next";
import { Alert, Button, Text } from "@noldg/ui";
import type { StudentLesson } from "@noldg/api/contracts/learning";
import { getStudentTeacherBrowsePath } from "../../../shared/navigation/routes";
import { formatRemainingFromServer } from "../../../shared/time/time";

/** Renders notices for server availability and lesson ownership.
 * @param props Server lesson metadata; timestamps affect display only.
 */
export function LessonNotices({ lesson }: { lesson: StudentLesson }) {
  const { t } = useTranslation("learning");
  const countdown = formatRemainingFromServer(lesson.availableFrom, lesson.serverNow);
  return (
    <>
      {lesson.availability === "upcoming" ? (
        <Alert tone="info" title={t("lesson.upcomingTitle")}>
          <Text>{t("lesson.opensIn", { time: countdown })}</Text>
        </Alert>
      ) : null}
      {lesson.availability === "ended" ? (
        <Alert tone="warning" title={t("lesson.endedTitle")}>
          <Text>{t("lesson.endedDescription")}</Text>
        </Alert>
      ) : null}
      {lesson.access === "not_owned" ? (
        <Alert tone="warning" title={t("lesson.notOwnedTitle")}>
          <Text>{t("lesson.notOwnedDescription")}</Text>
          <Button to={getStudentTeacherBrowsePath(lesson.teacher.id)} variant="secondary">
            {t("lesson.findTeacher")}
          </Button>
        </Alert>
      ) : null}
    </>
  );
}
