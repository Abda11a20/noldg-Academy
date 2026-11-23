import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AppError } from "@noldg/api/errors";
import { Skeleton, useToast } from "@noldg/ui";
import { useTranslation } from "react-i18next";
import { ROUTE_PATHS } from "../../../shared/navigation/routes";
import {
  useReviewTeacherApplication,
  useTeacherApplication,
} from "../hooks/useTeacherAdministration";
import { ApplicationDetailError } from "../components/ApplicationDetailError";
import { ApplicationDetailView } from "../components/ApplicationDetailView";

/** Shows application details and allows admins to approve or reject a pending application.
 * @returns Teacher application detail page.
 */
export function ApplicationDetailPage() {
  const { t } = useTranslation(["admin", "common"]);
  const navigate = useNavigate();
  const { applicationId = "" } = useParams();
  const application = useTeacherApplication(applicationId);
  const review = useReviewTeacherApplication();
  const { notify } = useToast();
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const record = application.data;
  const goBack = () => void navigate(ROUTE_PATHS.adminTeachers);
  const saveDecision = (reason?: string) => {
    if (!record || !decision) return;
    review.mutate(
      { id: record.id, status: decision, ...(reason ? { reason } : {}) },
      {
        onSuccess: () => {
          notify({ title: t("admin:teachers.states.reviewed"), tone: "success" });
          setDecision(null);
          goBack();
        },
        onError: (error) => {
          if (error instanceof AppError && error.status === 409) {
            notify({ title: t("admin:teachers.states.alreadyReviewed"), tone: "warning" });
            void application.refetch();
          }
        },
      },
    );
  };
  if (application.isLoading) return <Skeleton className="h-64" />;
  if (application.error || !record)
    return (
      <ApplicationDetailError
        error={application.error}
        labels={{
          forbiddenTitle: t("admin:teachers.states.forbiddenTitle"),
          forbiddenBody: t("admin:teachers.states.forbiddenBody"),
          unavailableTitle: t("admin:teachers.states.unavailableTitle"),
          unavailableBody: t("admin:teachers.states.unavailableBody"),
          detailUnavailable: t("admin:teachers.states.detailUnavailable"),
          retry: t("admin:teachers.actions.retry"),
        }}
        onRetry={() => void application.refetch()}
      />
    );
  return (
    <ApplicationDetailView
      record={record}
      decision={decision}
      onDecision={setDecision}
      onSaveDecision={saveDecision}
    />
  );
}
