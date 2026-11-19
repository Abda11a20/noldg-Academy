import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  Checkbox,
  FileDropzone,
  Link,
  PasswordField,
  Text,
  TextField,
  Textarea,
} from "@noldg/ui";
import { ROUTE_PATHS } from "../../../shared/navigation/routes";
import { AuthPanel } from "../components/AuthPanel";
import { OfferingsPicker } from "../components/OfferingsPicker";
import { useTeacherRegistration } from "../hooks/useRegistration";
import { AUTH_BIO_MAX_LENGTH, AUTH_IMAGE_ACCEPT, AUTH_IMAGE_MAX_BYTES } from "../constants";
import { translateAuthMessage } from "../utils/translate-error";
import { fieldErrorProps } from "../utils/field-error-props";

function formatMaximumFileSize(): number {
  return Math.floor(AUTH_IMAGE_MAX_BYTES / (1024 * 1024));
}

/** Renders the teacher application form with image selection and track-subject offering picker. */
export function TeacherRegistrationPage() {
  const { t } = useTranslation("auth");
  const state = useTeacherRegistration();
  const error = state.errorKey ? translateAuthMessage(state.errorKey) : undefined;
  const selectedFiles = state.selectedImage
    ? [{ name: state.selectedImage.name, size: `${Math.ceil(state.selectedImage.size / 1024)} KB` }]
    : [];

  const loadCatalog = state.loadCatalog;
  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  return (
    <AuthPanel title={t("teacher.title")} subtitle={t("teacher.subtitle")}>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {state.unavailable ? <Alert tone="warning">{t("student.catalogUnavailable")}</Alert> : null}
      <form className="flex flex-col gap-4" noValidate onSubmit={state.submit}>
        <TextField
          autoComplete="name"
          {...fieldErrorProps(state.form.formState.errors.name)}
          id="teacher-name"
          label={t("teacher.name")}
          {...state.form.register("name")}
        />
        <TextField
          autoComplete="email"
          {...fieldErrorProps(state.form.formState.errors.email)}
          id="teacher-email"
          inputMode="email"
          label={t("teacher.email")}
          {...state.form.register("email")}
        />
        <TextField
          autoComplete="tel"
          {...fieldErrorProps(state.form.formState.errors.phone)}
          id="teacher-phone"
          inputMode="tel"
          label={t("teacher.phone")}
          {...state.form.register("phone")}
        />
        <PasswordField
          autoComplete="new-password"
          {...fieldErrorProps(state.form.formState.errors.password)}
          hint={t("passwordHint")}
          hideLabel={t("login.hidePassword")}
          id="teacher-password"
          label={t("teacher.password")}
          showLabel={t("login.showPassword")}
          {...state.form.register("password")}
        />
        <PasswordField
          autoComplete="new-password"
          {...fieldErrorProps(state.form.formState.errors.passwordConfirmation)}
          hideLabel={t("login.hidePassword")}
          id="teacher-password-confirmation"
          label={t("teacher.confirmPassword")}
          showLabel={t("login.showPassword")}
          {...state.form.register("passwordConfirmation")}
        />
        <FileDropzone
          accept={AUTH_IMAGE_ACCEPT}
          description={t("teacher.photoDescription")}
          files={selectedFiles}
          label={t("teacher.photo")}
          maximumSize={t("teacher.photoLimit", { size: formatMaximumFileSize() })}
          onFilesSelected={(files) => {
            const file = files.item(0);
            if (!file) return;
            if (!file.type.startsWith("image/") || file.size > AUTH_IMAGE_MAX_BYTES) {
              state.form.resetField("image");
              state.form.setError("image", { type: "validate", message: "file" });
              state.setSelectedImage(undefined);
              return;
            }
            state.form.clearErrors("image");
            state.form.setValue("image", file, { shouldValidate: true });
            state.setSelectedImage(file);
          }}
        />
        {state.form.formState.errors.image ? (
          <Text tone="danger">{t("teacher.photoError")}</Text>
        ) : null}
        <Textarea
          {...fieldErrorProps(state.form.formState.errors.bio)}
          id="teacher-bio"
          label={t("teacher.bio")}
          maxLength={AUTH_BIO_MAX_LENGTH}
          showCharacterCount
          {...state.form.register("bio")}
        />
        <OfferingsPicker
          {...(state.catalog ? { catalog: state.catalog } : {})}
          {...(state.form.formState.errors.offerings ? { error: t("validation.offerings") } : {})}
          offerings={state.offerings}
          onAdd={state.addOfferings}
          onRemove={state.removeOffering}
          onSubjectToggle={state.toggleSubject}
          onSystemChange={state.selectSystem}
          onTrackToggle={state.toggleTrack}
          subjectIds={state.selectedSubjectIds}
          system={state.selectedSystem}
          trackIds={state.selectedTrackIds}
        />
        <Checkbox
          checked={state.form.watch("acceptTerms") === true}
          id="teacher-terms"
          label={t("teacher.terms")}
          onCheckedChange={(checked) => {
            if (checked === true)
              state.form.setValue("acceptTerms", true, { shouldValidate: true });
            else state.form.resetField("acceptTerms");
          }}
        />
        {state.form.formState.errors.acceptTerms ? (
          <Text tone="danger">{t("validation.terms")}</Text>
        ) : null}
        <Button
          disabled={state.pending || state.unavailable}
          loading={state.pending}
          type="submit"
          fullWidth
        >
          {t("teacher.submit")}
        </Button>
      </form>
      <Link to={ROUTE_PATHS.register}>{t("register.title")}</Link>
    </AuthPanel>
  );
}
