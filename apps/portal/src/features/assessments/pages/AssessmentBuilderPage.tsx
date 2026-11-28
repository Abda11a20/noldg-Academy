import { useParams } from "react-router";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { AppError } from "@noldg/api/errors";
import { capabilities } from "@noldg/api/config/capabilities";
import { Alert, Skeleton } from "@noldg/ui";
import { useAssessmentDetail } from "../hooks/useAssessments";
import { AssessmentBuilderWorkspace } from "../components/AssessmentBuilderWorkspace";
import type { EditableAssessmentType } from "../utils/builder-validation";

function resolveErrorMessage(
  error: unknown,
  t: TFunction<"assessments">,
  tErrors: TFunction<"errors">,
): string {
  if (error instanceof AppError && error.status === 403) return tErrors("forbidden");
  if (error instanceof AppError && error.status === 404) return t("assessmentNotFound");
  return t("loadError");
}

function resolveEditableType(
  existingType: string | undefined,
  routeType: string | undefined,
  action: string,
): EditableAssessmentType {
  return (existingType ?? routeType ?? action) === "homework" ? "homework" : "exam";
}

function parseBuilderRoute(params: Readonly<Record<string, string | undefined>>) {
  const courseId = params.courseId ?? "";
  const assessmentId = params.assessmentId ?? "";
  const action = params.action ?? "exam";
  const isEdit = assessmentId !== "" && assessmentId !== "new" && action === "edit";
  return { courseId, assessmentId, routeType: params.type, action, isEdit };
}

function renderWorkspace(
  route: ReturnType<typeof parseBuilderRoute>,
  existing: ReturnType<typeof useAssessmentDetail>["data"],
) {
  const type = resolveEditableType(existing?.type, route.routeType, route.action);
  const props = existing
    ? { courseId: route.courseId, type, existing }
    : { courseId: route.courseId, type };
  return <AssessmentBuilderWorkspace key={existing?.id ?? `new-${type}`} {...props} />;
}

/** Creates or edits an exam or homework using server validation as the authority.
 * @returns Loading, capability, error, or the mounted builder workspace.
 */
export function AssessmentBuilderPage() {
  const { t } = useTranslation("assessments");
  const { t: tErrors } = useTranslation("errors");
  const route = parseBuilderRoute(useParams());
  const detail = useAssessmentDetail(route.assessmentId, route.isEdit);
  if (!capabilities.assessmentTargeting) return <Alert tone="info">{t("liveUnavailable")}</Alert>;
  if (route.isEdit && detail.isPending) return <Skeleton height="lg" />;
  if (route.isEdit && detail.isError) {
    return (
      <Alert tone="danger" role="alert">
        {resolveErrorMessage(detail.error, t, tErrors)}
      </Alert>
    );
  }
  return renderWorkspace(route, route.isEdit ? detail.data : undefined);
}
