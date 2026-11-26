import { useTranslation } from "react-i18next";
import type { BrowseTeacherDetail } from "@noldg/api/contracts/browse";
import { Avatar, Badge, Chip, Heading, Stars, Text } from "@noldg/ui";
import { formatCairoDateTime } from "../../../shared/time/time";

interface TeacherProfileSummaryProps {
  teacher: BrowseTeacherDetail;
  name: string;
  bio: string;
  locale: string;
  language: string;
}

/** Renders the localized profile summary, ratings, subjects, and optional server timestamp. */
export function TeacherProfileSummary({
  teacher,
  name,
  bio,
  locale,
  language,
}: TeacherProfileSummaryProps) {
  const { t } = useTranslation("browse");
  return (
    <>
      <header className="flex flex-wrap items-center gap-4">
        <Avatar
          label={t("teacherPhoto", { name })}
          initials={name.slice(0, 1)}
          {...(teacher.photoUrl ? { remoteSrc: teacher.photoUrl } : {})}
        />
        <div>
          <Heading level={1}>{name}</Heading>
          {teacher.ratingAverage !== null ? (
            <div className="flex items-center gap-2">
              <Stars
                value={teacher.ratingAverage}
                label={t("ratingLabel", { value: teacher.ratingAverage })}
              />
              <Text size="sm" tone="muted">
                {t("ratingCount", { count: teacher.ratingCount })}
              </Text>
            </div>
          ) : (
            <Badge tone="neutral">{t("newTeacher")}</Badge>
          )}
        </div>
      </header>
      <div className="flex flex-wrap gap-2">
        {teacher.subjects.map((subject) => (
          <Chip key={subject.id}>
            {t(`subjects.${subject.id.replace("subject-", "")}`, {
              defaultValue: language.startsWith("ar")
                ? (subject.nameAr ?? subject.name)
                : subject.name,
            })}
          </Chip>
        ))}
      </div>
      <Text>{bio}</Text>
      {teacher.serverNow ? (
        <Badge tone="neutral">
          {t("serverTime", { time: formatCairoDateTime(teacher.serverNow, locale) })}
        </Badge>
      ) : null}
    </>
  );
}
