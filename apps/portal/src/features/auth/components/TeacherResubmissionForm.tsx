import { useTranslation } from "react-i18next";
import type { TeacherApplication } from "@noldg/api/contracts/admin";
import type { AcademicCatalog } from "@noldg/api/contracts/auth";
import { Button, FileDropzone, Text, TextField, Textarea } from "@noldg/ui";
import { AUTH_BIO_MAX_LENGTH, AUTH_IMAGE_ACCEPT, AUTH_IMAGE_MAX_BYTES } from "../constants";
import { OfferingsPicker } from "./OfferingsPicker";
import { useTeacherResubmission } from "../hooks/useTeacherResubmission";

interface TeacherResubmissionFormProps {
  application: TeacherApplication;
  catalog?: AcademicCatalog;
  onSuccess: () => void;
}

/** Renders editable profile fields for a rejected teacher application.
 * @param props Existing application, optional offering catalog, and success callback.
 */
export function TeacherResubmissionForm({
  application,
  catalog,
  onSuccess,
}: TeacherResubmissionFormProps) {
  const { t } = useTranslation("auth");
  const form = useTeacherResubmission({ application, ...(catalog ? { catalog } : {}), onSuccess });
  return (
    <form className="space-y-4" noValidate onSubmit={form.submit}>
      <TextField
        id="resubmit-name"
        label={t("teacher.name")}
        autoComplete="name"
        {...form.form.register("name")}
      />
      <TextField
        id="resubmit-email"
        label={t("teacher.email")}
        inputMode="email"
        autoComplete="email"
        {...form.form.register("email")}
      />
      <TextField
        id="resubmit-phone"
        label={t("teacher.phone")}
        inputMode="tel"
        autoComplete="tel"
        {...form.form.register("phone")}
      />
      <Textarea
        id="resubmit-bio"
        label={t("teacher.bio")}
        maxLength={AUTH_BIO_MAX_LENGTH}
        showCharacterCount
        {...form.form.register("bio")}
      />
      <FileDropzone
        accept={AUTH_IMAGE_ACCEPT}
        label={t("teacher.photo")}
        description={t("teacher.photoDescription")}
        maximumSize={t("teacher.photoLimit", {
          size: Math.floor(AUTH_IMAGE_MAX_BYTES / (1024 * 1024)),
        })}
        files={form.selectedFiles}
        onFilesSelected={form.onImageSelected}
      />
      <OfferingsPicker
        {...(catalog ? { catalog } : {})}
        system={form.system}
        trackIds={form.trackIds}
        subjectIds={form.subjectIds}
        offerings={form.offerings}
        onSystemChange={form.onSystemChange}
        onTrackToggle={form.onTrackToggle}
        onSubjectToggle={form.onSubjectToggle}
        onAdd={form.addOfferings}
        onRemove={form.onRemoveOffering}
      />
      {form.error ? <Text tone="danger">{t(form.error)}</Text> : null}
      <Button
        disabled={form.pending || form.offerings.length === 0}
        loading={form.pending}
        type="submit"
        fullWidth
      >
        {t("pending.resubmit")}
      </Button>
    </form>
  );
}
