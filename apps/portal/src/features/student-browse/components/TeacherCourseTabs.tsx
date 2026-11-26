import { useTranslation } from "react-i18next";
import type { BrowseCourse } from "@noldg/api/contracts/browse";
import { EmptyState, Tabs } from "@noldg/ui";
import { TeacherCoursePanel } from "./TeacherCoursePanel";

interface TeacherCourseTabsProps {
  courses: BrowseCourse[];
  enabled: boolean;
  arabic: boolean;
  locale: string;
}

/** Renders track-matched course tabs or a translated capability/empty state. */
export function TeacherCourseTabs({ courses, enabled, arabic, locale }: TeacherCourseTabsProps) {
  const { t } = useTranslation("browse");
  if (!enabled)
    return (
      <EmptyState
        icon="book"
        title={t("coursesUnavailableTitle")}
        description={t("coursesUnavailableDescription")}
      />
    );
  if (courses.length === 0)
    return (
      <EmptyState icon="book" title={t("noCoursesTitle")} description={t("noCoursesDescription")} />
    );
  return (
    <Tabs
      label={t("courseTabsLabel")}
      items={courses.map((course) => ({
        value: course.id,
        label: arabic ? (course.subject.nameAr ?? course.subject.name) : course.subject.name,
        content: <TeacherCoursePanel course={course} locale={locale} />,
      }))}
    />
  );
}
