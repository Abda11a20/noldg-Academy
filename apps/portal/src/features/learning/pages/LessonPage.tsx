import { useState } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Button, Heading, Text } from "@noldg/ui";
import { AppError } from "@noldg/api/errors";
import { getStudentCheckoutPath, ROUTE_PATHS } from "../../../shared/navigation/routes";
import { useAttachmentDownload } from "../hooks/useAttachmentDownload";
import { usePlaybackSession } from "../hooks/usePlaybackSession";
import { useStudentLesson } from "../hooks/useLearningQueries";
import { LessonAttachments } from "../components/LessonAttachments";
import { LessonDescription } from "../components/LessonDescription";
import { LessonHeader } from "../components/LessonHeader";
import { LessonNotices } from "../components/LessonNotices";
import { LessonPlaybackSection } from "../components/LessonPlaybackSection";
import { LessonQuizEntry } from "../components/LessonQuizEntry";

type LessonErrorKey = "lesson.notFound" | "lesson.unavailable" | "lesson.loadError";

function getLessonErrorKey(error: unknown): LessonErrorKey {
  if (!(error instanceof AppError)) return "lesson.loadError";
  if (error.status === 404) return "lesson.notFound";
  if (error.status === 501) return "lesson.unavailable";
  return "lesson.loadError";
}

/** Renders lesson access states, the active video session, attachments, and quiz entry. */
export function LessonPage() {
  const { lessonId = "" } = useParams();
  const { t, i18n } = useTranslation(["learning", "common"]);
  const query = useStudentLesson(lessonId);
  const attachmentDownload = useAttachmentDownload(lessonId);
  const [progressState, setProgressState] = useState<{ lessonId: string; value: number } | null>(
    null,
  );
  const [completedLessonId, setCompletedLessonId] = useState<string | null>(null);
  const playback = usePlaybackSession(lessonId, (value) => {
    setProgressState({ lessonId, value: value.watchedPercent });
    if (value.thresholdReached) setCompletedLessonId(lessonId);
  });

  if (query.isPending) return <Text role="status">{t("myLessons.loading")}</Text>;
  if (query.isError) {
    return (
      <section className="flex flex-col gap-4" role="alert">
        <Heading level={1}>{t(getLessonErrorKey(query.error))}</Heading>
        <Button to={ROUTE_PATHS.studentLessons} variant="secondary">
          {t("lesson.backToLessons")}
        </Button>
      </section>
    );
  }

  const lesson = query.data;
  const progress = progressState?.lessonId === lessonId ? progressState.value : undefined;
  return (
    <section className="flex flex-col gap-5">
      <LessonHeader language={i18n.language} lesson={lesson} />
      <LessonNotices lesson={lesson} />
      <LessonPlaybackSection
        lesson={lesson}
        playback={playback}
        {...(typeof progress === "number" ? { progress } : {})}
      />
      <LessonDescription description={lesson.description} />
      <LessonAttachments download={attachmentDownload} lesson={lesson} />
      <LessonQuizEntry lesson={lesson} serverThresholdReached={completedLessonId === lessonId} />
      {lesson.access === "not_owned" && lesson.productId ? (
        <Button to={getStudentCheckoutPath(lesson.productId)} variant="secondary">
          {t("lesson.viewProduct")}
        </Button>
      ) : null}
    </section>
  );
}
