import { useTranslation } from "react-i18next";
import { Tabs } from "@noldg/ui";
import { AssessmentListPanel } from "./AssessmentListPanel";

/** Presents course exams and homework in separate keyboard-accessible tabs.
 * @param props Course identifier for both lists.
 */
export function CourseAssessmentTabs({ courseId }: { courseId: string }) {
  const { t } = useTranslation("assessments");
  return (
    <Tabs
      label={t("courseTabs")}
      items={[
        {
          value: "exams",
          label: t("examsTitle"),
          content: <AssessmentListPanel courseId={courseId} type="exam" />,
        },
        {
          value: "homework",
          label: t("homeworkTitle"),
          content: <AssessmentListPanel courseId={courseId} type="homework" />,
        },
      ]}
    />
  );
}
