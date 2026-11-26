import { useTranslation } from "react-i18next";
import { Avatar, Badge, Card, CardBody, Chip, Link, Stars, Text } from "@noldg/ui";
import type { BrowseTeacher } from "@noldg/api/contracts/browse";
import { formatMoney } from "../../../shared/i18n/formatting";
import { getStudentTeacherPath } from "../../../shared/navigation/routes";

interface TeacherCardProps {
  teacher: BrowseTeacher;
  returnSearch: string;
}

/** Presents one server-filtered teacher summary without deriving rating or pricing values. */
export function TeacherCard({ teacher, returnSearch }: TeacherCardProps) {
  const { t, i18n } = useTranslation("browse");
  const arabic = i18n.resolvedLanguage?.startsWith("ar") ?? true;
  const name = arabic ? (teacher.nameAr ?? teacher.name) : teacher.name;
  return (
    <Card className="h-full">
      <CardBody className="flex h-full flex-col gap-3">
        <div className="flex items-center gap-3">
          <Avatar
            label={t("teacherPhoto", { name })}
            initials={name.slice(0, 1)}
            {...(teacher.photoUrl ? { remoteSrc: teacher.photoUrl } : {})}
          />
          <div className="min-w-0">
            <Link className="font-semibold" to={getStudentTeacherPath(teacher.id, returnSearch)}>
              {name}
            </Link>
            {teacher.ratingAverage === null ? (
              <Badge tone="neutral">{t("newTeacher")}</Badge>
            ) : (
              <div className="flex items-center gap-2">
                <Stars
                  value={teacher.ratingAverage}
                  label={t("ratingLabel", { value: teacher.ratingAverage })}
                />
                <Text size="sm" tone="muted">
                  {t("ratingCount", { count: teacher.ratingCount })}
                </Text>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {teacher.subjects.map((subject) => (
            <Chip key={subject.id}>
              {t(`subjects.${subject.id.replace("subject-", "")}`, { defaultValue: subject.name })}
            </Chip>
          ))}
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2">
          {teacher.startingPrice !== null ? (
            <Badge tone="primary">
              {t("startingPrice", { price: formatMoney(teacher.startingPrice) })}
            </Badge>
          ) : null}
          {teacher.hasFreeLessons ? <Badge tone="success">{t("freeLessons")}</Badge> : null}
        </div>
      </CardBody>
    </Card>
  );
}
