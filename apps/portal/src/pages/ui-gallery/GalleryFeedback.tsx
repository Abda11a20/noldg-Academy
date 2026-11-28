import { useTranslation } from "react-i18next";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Heading,
  Inline,
  ProgressBar,
  Skeleton,
  Stack,
} from "@noldg/ui";

/** Shows translated feedback components in their available visual tones. */
export function GalleryFeedback() {
  const { t } = useTranslation("gallery");

  return (
    <section aria-label={t("galleryFeedback")}>
      <Heading level={3}>{t("galleryFeedback")}</Heading>
      <Stack className="mt-4">
        <Inline>
          {(["info", "success", "warning", "danger"] as const).map((tone) => (
            <Alert key={tone} tone={tone} title={t("sampleAlertTitle")}>
              {t("sampleAlertBody")}
            </Alert>
          ))}
        </Inline>
        <Inline>
          {(["neutral", "primary", "success", "warning", "danger", "info"] as const).map((tone) => (
            <Badge key={tone} tone={tone}>
              {t("sampleBadge")}
            </Badge>
          ))}
        </Inline>
        <Inline>
          <Skeleton height="sm" width="third" />
          <Skeleton height="md" width="half" />
          <Skeleton height="lg" />
        </Inline>
        <ProgressBar label={t("sampleProgress")} value={64} />
        <ProgressBar label={t("sampleLoading")} />
        <EmptyState
          description={t("sampleEmptyBody")}
          icon="book"
          title={t("sampleEmptyTitle")}
          action={<Button>{t("sampleAction")}</Button>}
        />
        <ErrorState
          description={t("sampleError")}
          onRetry={() => undefined}
          retryLabel={t("sampleRetry")}
          title={t("sampleErrorTitle")}
        />
      </Stack>
    </section>
  );
}
