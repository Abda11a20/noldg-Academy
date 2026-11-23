import { Alert, Text } from "@noldg/ui";
import type { TeacherApplication } from "@noldg/api/contracts/admin";
import type { AcademicCatalog } from "@noldg/api/contracts/auth";
import { useTranslation } from "react-i18next";
import { TeacherResubmissionForm } from "./TeacherResubmissionForm";
import { TeacherApplicationSummary } from "./TeacherApplicationSummary";
import { TeacherApplicationTimeline } from "./TeacherApplicationTimeline";

interface TeacherPendingBodyProps {
  registrationReceived: boolean;
  rejected: boolean;
  rejectionReason?: string;
  application?: TeacherApplication;
  catalog?: AcademicCatalog;
  unavailable: boolean;
  onResubmit: () => void;
}

/** Renders the teacher application summary, timeline, and rejected resubmission form.
 * @param props Application data, state flags, and refresh event.
 */
export function TeacherPendingBody({
  registrationReceived,
  rejected,
  rejectionReason,
  application,
  catalog,
  unavailable,
  onResubmit,
}: TeacherPendingBodyProps) {
  const { t } = useTranslation("auth");
  const summary = application ? <TeacherApplicationSummary application={application} /> : null;
  const timeline = <TeacherApplicationTimeline application={application} rejected={rejected} />;
  const rejection = rejected && rejectionReason ? <Text>{rejectionReason}</Text> : null;
  const unavailableState = unavailable ? (
    <Alert tone="warning">{t("pending.profileUnavailable")}</Alert>
  ) : null;
  const resubmission =
    rejected && application && catalog ? (
      <TeacherResubmissionForm application={application} catalog={catalog} onSuccess={onResubmit} />
    ) : null;
  const receipt = registrationReceived ? (
    <Alert tone="success" title={t("teacher.applicationReceived")}>
      {t("teacher.applicationReceivedBody")}
    </Alert>
  ) : null;
  return (
    <div className="space-y-4">
      {receipt}
      {rejection}
      {summary}
      {timeline}
      {unavailableState}
      {resubmission}
    </div>
  );
}
