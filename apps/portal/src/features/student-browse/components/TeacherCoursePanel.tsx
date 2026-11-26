import { useTranslation } from "react-i18next";
import type { BrowseCourse } from "@noldg/api/contracts/browse";
import { EmptyState, Heading } from "@noldg/ui";
import { BrowseProductCard } from "./BrowseProductCard";
import { LessonPreviewRow } from "./LessonPreviewRow";

interface TeacherCoursePanelProps {
  course: BrowseCourse;
  locale: string;
}

/** Renders one course's lesson previews and server-priced products. */
export function TeacherCoursePanel({ course, locale }: TeacherCoursePanelProps) {
  const { t } = useTranslation("browse");
  return (
    <div className="flex flex-col gap-6">
      <section aria-label={t("lessonsTitle")} className="flex flex-col gap-3">
        <Heading level={2}>{t("lessonsTitle")}</Heading>
        {course.lessons.map((lesson) => (
          <LessonPreviewRow key={lesson.id} lesson={lesson} locale={locale} />
        ))}
        {course.lessons.length === 0 ? (
          <EmptyState
            icon="book"
            title={t("noLessonsTitle")}
            description={t("noLessonsDescription")}
          />
        ) : null}
      </section>
      <section aria-label={t("productsTitle")} className="flex flex-col gap-3">
        <Heading level={2}>{t("productsTitle")}</Heading>
        {course.products.map((product) => (
          <BrowseProductCard key={product.id} product={product} />
        ))}
        {course.products.length === 0 ? (
          <EmptyState
            icon="book"
            title={t("noProductsTitle")}
            description={t("noProductsDescription")}
          />
        ) : null}
      </section>
    </div>
  );
}
