import { Card, CardBody, CardHeader, Heading } from "@noldg/ui";
import type { TeacherApplication } from "@noldg/api/contracts/admin";
import { useTranslation } from "react-i18next";
import { formatDate } from "../../../shared/i18n/formatting";

interface TeacherApplicationTimelineProps {
  application?: TeacherApplication | undefined;
  rejected: boolean;
}

/** Renders submitted, review, and decision milestones for a teacher application.
 * @param props Optional application dates and current rejection state.
 */
export function TeacherApplicationTimeline({
  application,
  rejected,
}: TeacherApplicationTimelineProps) {
  const { t } = useTranslation("auth");
  const submittedAt = application
    ? t("pending.timelineDate", { date: formatDate(application.submittedAt) })
    : "";
  const decisionKey = rejected ? "pending.rejected" : "pending.decisionPending";
  return (
    <Card>
      <CardHeader>
        <Heading level={2} size="md">
          {t("pending.timelineTitle")}
        </Heading>
      </CardHeader>
      <CardBody>
        <ol className="space-y-2">
          <li>
            {t("pending.submitted")}
            {submittedAt}
          </li>
          <li>{t("pending.underReview")}</li>
          <li>{t(decisionKey)}</li>
        </ol>
      </CardBody>
    </Card>
  );
}
