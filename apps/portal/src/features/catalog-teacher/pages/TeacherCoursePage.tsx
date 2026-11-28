import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { Breadcrumbs, ErrorState, Heading, Skeleton, Tabs } from "@noldg/ui";
import { useCatalogQueries } from "../hooks/useCatalogQueries";
import { LessonsPanel } from "../components/LessonsPanel";
import { BundlesPanel } from "../components/BundlesPanel";
import { COURSE_LOOKUP_PAGE_SIZE } from "../constants";
import { isForbiddenError } from "../../../shared/errors/isForbiddenError";
import { ROUTE_PATHS } from "../../../shared/navigation/routes";
import { CourseAssessmentTabs } from "../../assessments/index";

/** Composes the teacher course title and its lesson and bundle tabs. */
export function TeacherCoursePage() {
  const { t } = useTranslation(["catalog", "errors", "assessments"]);
  const { courseId } = useParams();
  const { courses } = useCatalogQueries(undefined, {
    page: 1,
    pageSize: COURSE_LOOKUP_PAGE_SIZE,
    search: "",
    filters: {},
  });
  if (!courseId)
    return <ErrorState title={t("courseNotFound")} description={t("courseNotFound")} />;
  if (courses.isPending) return <Skeleton height="lg" />;
  const course = courses.data?.items.find((item) => item.id === courseId);
  if (courses.isError)
    return (
      <ErrorState
        title={
          isForbiddenError(courses.error) ? t("errors:forbidden") : t("catalog:courseNotFound")
        }
        description={
          isForbiddenError(courses.error) ? t("errors:forbidden") : t("catalog:courseNotFound")
        }
      />
    );
  if (!course) return <ErrorState title={t("courseNotFound")} description={t("courseNotFound")} />;
  return (
    <section className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t("coursesTitle"), to: ROUTE_PATHS.teacher },
          { label: course.subject.name },
        ]}
        label={t("courseBreadcrumb")}
      />
      <Heading level={1}>{course.subject.name}</Heading>
      <Tabs
        label={t("courseTabs")}
        items={[
          {
            value: "lessons",
            label: t("courseLessons"),
            content: <LessonsPanel courseId={course.id} />,
          },
          {
            value: "bundles",
            label: t("courseBundles"),
            content: <BundlesPanel courseId={course.id} />,
          },
          {
            value: "exams-homework",
            label: t("assessments:assessmentsTab"),
            content: <CourseAssessmentTabs courseId={course.id} />,
          },
        ]}
      />
    </section>
  );
}
