import { Card, CardBody, CardHeader, Chip, Heading, Text } from "@noldg/ui";
import type { TeacherApplication } from "@noldg/api/contracts/admin";
import { useTranslation } from "react-i18next";

interface TeacherApplicationSummaryProps {
  application: TeacherApplication;
}

/** Renders the applicant bio and selected teaching offerings.
 * @param props Normalized teacher profile.
 */
export function TeacherApplicationSummary({ application }: TeacherApplicationSummaryProps) {
  const { t } = useTranslation("auth");
  return (
    <Card>
      <CardHeader>
        <Heading level={2} size="md">
          {t("pending.summary")}
        </Heading>
      </CardHeader>
      <CardBody>
        <Text>{application.bio}</Text>
        <div className="mt-3 flex flex-wrap gap-2">
          {application.offerings.map((offering) => (
            <Chip key={`${offering.trackId}-${offering.subjectId}`}>
              {t("pending.offering", {
                track: offering.track?.name ?? offering.trackId,
                subject: offering.subject?.name ?? offering.subjectId,
              })}
            </Chip>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
