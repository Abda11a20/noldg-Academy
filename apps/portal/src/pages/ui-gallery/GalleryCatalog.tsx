import { useForm, useWatch } from "react-hook-form";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Heading } from "@noldg/ui";
import {
  ATTACHMENT_ACCEPT,
  VIDEO_ACCEPTED_TYPES,
} from "../../features/catalog-teacher/upload-constants";
import {
  LESSON_FORM_DEFAULTS,
  type LessonFormValues,
} from "../../features/catalog-teacher/schemas/lesson-form";
import { LessonBasicsSection } from "../../features/catalog-teacher/components/LessonBasicsSection";
import { LessonScheduleSection } from "../../features/catalog-teacher/components/LessonScheduleSection";
import { LessonAccessSection } from "../../features/catalog-teacher/components/LessonAccessSection";
import { LessonVideoSection } from "../../features/catalog-teacher/components/LessonVideoSection";
import { LessonAttachmentsSection } from "../../features/catalog-teacher/components/LessonAttachmentsSection";
import { LessonStatusSection } from "../../features/catalog-teacher/components/LessonStatusSection";
import { BundleEditorDialog } from "../../features/catalog-teacher/components/BundleEditorDialog";
import { EMPTY_BUNDLE_FORM } from "../../features/catalog-teacher/hooks/useBundlePanelState";
import type { BundleFormValues } from "../../features/catalog-teacher/hooks/useBundlePanelState";

/** Demonstrates each reusable lesson editor section with translated labels in the active direction. */
export function GalleryCatalog() {
  const { t } = useTranslation(["common", "catalog"]);
  const form = useForm<LessonFormValues>({ defaultValues: LESSON_FORM_DEFAULTS });
  const access = useWatch({ control: form.control, name: "access" });
  const [bundleOpen, setBundleOpen] = useState(false);
  const [bundleForm, setBundleForm] = useState<BundleFormValues>(EMPTY_BUNDLE_FORM);
  return (
    <section aria-label={t("galleryForms")} className="space-y-5">
      <Heading level={3}>{t("galleryForms")}</Heading>
      <LessonBasicsSection
        descriptionField={form.register("description")}
        titleField={form.register("title")}
      />
      <LessonScheduleSection
        control={form.control}
        disabled={false}
        startError={undefined}
        endError={undefined}
        validationMessage={() => undefined}
      />
      <LessonAccessSection access={access} control={form.control} />
      <LessonVideoSection
        acceptedTypes={VIDEO_ACCEPTED_TYPES.join(",")}
        largeFileWarning={false}
        maximumSize={t("sampleFileSize")}
        onCancel={() => undefined}
        onRemove={() => undefined}
        onRetry={() => undefined}
        onSelect={() => undefined}
        onStart={() => undefined}
        replacementPending={false}
        uploadState={{ status: "idle" }}
      />
      <LessonAttachmentsSection
        acceptedTypes={ATTACHMENT_ACCEPT}
        files={[]}
        maximumSize={t("sampleFileSize")}
        onRemove={() => undefined}
        onRetry={() => undefined}
        onSelect={() => undefined}
        rejectedCount={0}
      />
      <LessonStatusSection
        busy={false}
        canSaveDraft
        isReady={false}
        onPublish={() => undefined}
        onSaveDraft={() => undefined}
      />
      <Button onClick={() => setBundleOpen(true)}>{t("catalog:createBundle")}</Button>
      <BundleEditorDialog
        editing={undefined}
        form={bundleForm}
        lessons={[]}
        onFormChange={setBundleForm}
        onOpenChange={setBundleOpen}
        onSave={() => setBundleOpen(false)}
        onSearchChange={() => undefined}
        onToggleLesson={() => undefined}
        open={bundleOpen}
        pending={false}
        search=""
        valid
      />
    </section>
  );
}
