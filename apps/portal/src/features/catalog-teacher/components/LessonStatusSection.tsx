import { useTranslation } from "react-i18next";
import { Alert, Button } from "@noldg/ui";

interface LessonStatusSectionProps {
  isReady: boolean;
  busy: boolean;
  canSaveDraft: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
}

/** Renders readiness feedback and lesson save or publish actions. @param props Publishing state and callbacks. */
export function LessonStatusSection({
  isReady,
  busy,
  canSaveDraft,
  onSaveDraft,
  onPublish,
}: LessonStatusSectionProps) {
  const { t } = useTranslation("catalog");
  return (
    <section className="space-y-3">
      {!isReady ? <Alert tone="info">{t("publishNeedsReadyVideo")}</Alert> : null}
      <div className="flex flex-wrap gap-3">
        <Button
          disabled={busy || !canSaveDraft}
          loading={busy}
          onClick={onSaveDraft}
          type="button"
          variant="secondary"
        >
          {t("saveDraft")}
        </Button>
        <Button disabled={busy || !isReady} loading={busy} onClick={onPublish} type="button">
          {t("publishLesson")}
        </Button>
      </div>
    </section>
  );
}
