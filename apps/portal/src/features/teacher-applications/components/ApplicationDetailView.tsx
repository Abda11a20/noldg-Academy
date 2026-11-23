import { ADMIN_REASON_MIN_LENGTH } from "@noldg/api/constants/admin";
import type { TeacherApplication } from "@noldg/api/contracts/admin";
import {
  Avatar,
  Breadcrumbs,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  ConfirmDialog,
  Heading,
} from "@noldg/ui";
import { useTranslation } from "react-i18next";
import { formatDate } from "../../../shared/i18n/formatting";
import { ROUTE_PATHS } from "../../../shared/navigation/routes";
import { APPLICATION_STATUS_LABEL_KEYS } from "../translation-keys";

interface ApplicationDetailViewProps {
  record: TeacherApplication;
  decision: "approved" | "rejected" | null;
  onDecision: (decision: "approved" | "rejected" | null) => void;
  onSaveDecision: (reason?: string) => void;
}

/** Renders the applicant profile, status history, and review confirmation dialog.
 * @param props Application record and review actions.
 */
export function ApplicationDetailView({
  record,
  decision,
  onDecision,
  onSaveDecision,
}: ApplicationDetailViewProps) {
  const { t } = useTranslation(["admin", "common"]);
  const initials = record.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.at(0))
    .join("");
  const offeringChips = record.offerings.map((offering) => (
    <Chip key={`${offering.trackId}-${offering.subjectId}`}>
      {t("admin:teachers.detail.offering", {
        track: offering.track?.name ?? offering.trackId,
        subject: offering.subject?.name ?? offering.subjectId,
      })}
    </Chip>
  ));
  const rejectReason = {
    id: "review-reason",
    label: t("admin:teachers.fields.reason"),
    hint: t("admin:teachers.detail.reasonHint", { count: ADMIN_REASON_MIN_LENGTH }),
    minimumLength: ADMIN_REASON_MIN_LENGTH,
  };
  return (
    <div className="space-y-5">
      <Breadcrumbs
        label={t("admin:list.pageLabel")}
        items={[
          { label: t("admin:teachers.title"), to: ROUTE_PATHS.adminTeachers },
          { label: record.name },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Heading level={1}>{t("admin:teachers.detail.title")}</Heading>
        <div className="flex gap-2">
          <Button
            disabled={record.status !== "pending"}
            onClick={() => onDecision("approved")}
            variant="primary"
          >
            {t("admin:teachers.actions.approve")}
          </Button>
          <Button
            disabled={record.status !== "pending"}
            onClick={() => onDecision("rejected")}
            variant="danger"
          >
            {t("admin:teachers.actions.reject")}
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar
              label={record.name}
              initials={initials}
              {...(record.imageUrl ? { remoteSrc: record.imageUrl } : {})}
              size="lg"
            />
            <div>
              <Heading level={2} size="md">
                {record.name}
              </Heading>
              <p className="text-foreground-muted">{record.email}</p>
              <p className="text-foreground-muted">{record.phone}</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <h2 className="mb-2 font-semibold">{t("admin:teachers.fields.bio")}</h2>
          <p>{record.bio}</p>
          <h2 className="mb-2 mt-5 font-semibold">{t("admin:teachers.fields.offerings")}</h2>
          <div className="flex flex-wrap gap-2">{offeringChips}</div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <Heading level={2} size="md">
            {t("admin:teachers.detail.timelineTitle")}
          </Heading>
        </CardHeader>
        <CardBody>
          <ol className="space-y-3">
            <li>
              {t("admin:teachers.detail.timelineEntry", {
                label: t("admin:teachers.statuses.submitted"),
                date: formatDate(record.submittedAt),
              })}
            </li>
            <li>{t("admin:teachers.statuses.review")}</li>
            <li>
              {t("admin:teachers.detail.timelineEntry", {
                label: t("admin:teachers.statuses.decision"),
                date: record.reviewedAt
                  ? formatDate(record.reviewedAt)
                  : t(APPLICATION_STATUS_LABEL_KEYS[record.status]),
              })}
            </li>
            {record.status === "rejected" ? (
              <li>{record.rejectionReason ?? t("admin:teachers.detail.noReason")}</li>
            ) : null}
          </ol>
        </CardBody>
      </Card>
      <ConfirmDialog
        open={decision !== null}
        onOpenChange={(open) => {
          if (!open) onDecision(null);
        }}
        title={t(
          decision === "rejected"
            ? "admin:teachers.detail.rejectTitle"
            : "admin:teachers.detail.approveTitle",
        )}
        closeLabel={t("admin:common.close")}
        confirmLabel={t("admin:teachers.actions.save")}
        cancelLabel={t("admin:academic.actions.cancel")}
        {...(decision === "rejected" ? { reason: rejectReason } : {})}
        onConfirm={onSaveDecision}
      />
    </div>
  );
}
