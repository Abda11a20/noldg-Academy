import { useParams, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { capabilities } from "@noldg/api/config/capabilities";
import { Breadcrumbs } from "@noldg/ui";
import { ROUTE_PATHS } from "../../../shared/navigation/routes";
import { useStudentTrack } from "../hooks/useStudentTrack";
import { TeacherCourseTabs } from "../components/TeacherCourseTabs";
import { TeacherProfileSummary } from "../components/TeacherProfileSummary";
import { TeacherDetailState } from "../components/TeacherDetailState";
import { useBrowseTeacher } from "../hooks/useBrowseTeacher";

type TeacherDetail = NonNullable<ReturnType<typeof useBrowseTeacher>["data"]>;

function localizedProfile(teacher: TeacherDetail, arabic: boolean) {
  const name = arabic ? (teacher.nameAr ?? teacher.name) : teacher.name;
  const bio = arabic ? (teacher.bioAr ?? teacher.bio) : teacher.bio;
  return { name, bio };
}

function coursesForTrack(teacher: TeacherDetail, trackId: string | undefined) {
  if (!trackId) return teacher.courses;
  return teacher.courses.filter((course) => course.track.id === trackId);
}

/** Renders one teacher profile, server-provided availability, and server pricing previews. */
export function TeacherDetailPage() {
  const { teacherId = "" } = useParams();
  const [params] = useSearchParams();
  const { t, i18n } = useTranslation(["browse", "common"]);
  const { trackId } = useStudentTrack();
  const result = useBrowseTeacher(teacherId);
  const arabic = i18n.resolvedLanguage?.startsWith("ar") ?? true;
  const listPath = `${ROUTE_PATHS.studentTeachers}${params.size ? `?${params.toString()}` : ""}`;

  if (result.isPending || result.isError)
    return (
      <TeacherDetailState
        pending={result.isPending}
        error={result.isError ? result.error : null}
        onRetry={() => void result.refetch()}
      />
    );

  const teacher = result.data;
  const { name, bio } = localizedProfile(teacher, arabic);
  const courses = coursesForTrack(teacher, trackId);
  return (
    <section className="flex flex-col gap-5">
      <Breadcrumbs
        label={t("common:galleryBreadcrumbLabel")}
        items={[
          { label: t("common:sampleStudent"), to: ROUTE_PATHS.student },
          { label: t("teachersTitle"), to: listPath },
          { label: name },
        ]}
      />
      <TeacherProfileSummary
        teacher={teacher}
        name={name}
        bio={bio}
        locale={i18n.language}
        language={i18n.language}
      />
      <TeacherCourseTabs
        courses={courses}
        enabled={capabilities.teacherBrowseCourses}
        arabic={arabic}
        locale={i18n.language}
      />
    </section>
  );
}
