import { useForm, useWatch } from "react-hook-form";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Heading } from "@noldg/ui";
import {
  ATTACHMENT_ACCEPT,
  BundleEditorDialog,
  EMPTY_BUNDLE_FORM,
  LESSON_FORM_DEFAULTS,
  LessonAccessSection,
  LessonAttachmentsSection,
  LessonBasicsSection,
  LessonScheduleSection,
  LessonStatusSection,
  LessonVideoSection,
  VIDEO_ACCEPTED_TYPES,
  type BundleFormValues,
  type LessonFormValues,
} from "../../features/catalog-teacher";

/** Demonstrates each reusable lesson editor section with translated labels in the active direction. */
export function GalleryCatalog() {
  const { t } = useTranslation(["gallery", "catalog"]);
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
