import { useTranslation } from "react-i18next";
import { Button, Checkbox, PasswordField, Select, Text, TextField } from "@noldg/ui";
import type { AcademicTrack } from "@noldg/api/contracts/auth";
import { useStudentRegistration } from "../hooks/useRegistration";
import { CatalogSystemSelect } from "./CatalogSystemSelect";
import { fieldErrorProps } from "../utils/field-error-props";

interface StudentRegistrationFieldsProps {
  registration: ReturnType<typeof useStudentRegistration>;
  system: string;
  tracks: AcademicTrack[];
  onSystemChange: (system: string) => void;
}

/** Renders all student registration fields and controlled catalog inputs. @param props Registration state and catalog selection events. */
export function StudentRegistrationFields({
  registration,
  system,
  tracks,
  onSystemChange,
}: StudentRegistrationFieldsProps) {
  const { t } = useTranslation("auth");
  const { form, pending, unavailable, loading, supportsStudentProfileFields } = registration;
  const selectedTrack = form.watch("trackId");

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={registration.submit}>
      <TextField
        autoComplete="name"
        {...fieldErrorProps(form.formState.errors.name)}
        id="student-name"
        label={t("student.name")}
        {...form.register("name")}
      />
      <TextField
        autoComplete="email"
        {...fieldErrorProps(form.formState.errors.email)}
        id="student-email"
        inputMode="email"
        label={t("student.email")}
        {...form.register("email")}
      />
      <TextField
        autoComplete="tel"
        {...fieldErrorProps(form.formState.errors.phone)}
        id="student-phone"
        inputMode="tel"
        label={t("student.phone")}
        {...form.register("phone")}
      />
      {supportsStudentProfileFields ? (
        <TextField
          autoComplete="tel"
          {...fieldErrorProps(form.formState.errors.parentPhone)}
          id="student-parent-phone"
          inputMode="tel"
          label={t("student.parentPhone")}
          {...form.register("parentPhone")}
        />
      ) : null}
      <PasswordField
        autoComplete="new-password"
        {...fieldErrorProps(form.formState.errors.password)}
        hint={t("passwordHint")}
        hideLabel={t("login.hidePassword")}
        id="student-password"
        label={t("student.password")}
        showLabel={t("login.showPassword")}
        {...form.register("password")}
      />
      <PasswordField
        autoComplete="new-password"
        {...fieldErrorProps(form.formState.errors.passwordConfirmation)}
        hideLabel={t("login.hidePassword")}
        id="student-password-confirmation"
        label={t("student.confirmPassword")}
        showLabel={t("login.showPassword")}
        {...form.register("passwordConfirmation")}
      />
      {supportsStudentProfileFields ? (
        <>
          <CatalogSystemSelect
            id="student-system"
            label={t("student.system")}
            onChange={onSystemChange}
            systems={registration.catalog?.systems ?? []}
            value={system}
          />
          <Select
            disabled={!system || loading || unavailable}
            {...fieldErrorProps(form.formState.errors.trackId)}
            id="student-track"
            label={t("student.track")}
            onValueChange={(value) => form.setValue("trackId", value, { shouldValidate: true })}
            options={tracks.map((track) => ({ value: track.id, label: track.name }))}
            placeholder={t("selectPlaceholder")}
            value={selectedTrack}
          />
          {loading ? <Text tone="muted">{t("student.catalogLoading")}</Text> : null}
          <Checkbox
            checked={form.watch("acceptTerms") === true}
            id="student-terms"
            label={t("student.terms")}
            onCheckedChange={(checked) => {
              if (checked === true) form.setValue("acceptTerms", true, { shouldValidate: true });
              else form.resetField("acceptTerms");
            }}
          />
          {form.formState.errors.acceptTerms ? (
            <Text tone="danger">{t("validation.terms")}</Text>
          ) : null}
        </>
      ) : null}
      <Button disabled={pending || unavailable} loading={pending} type="submit" fullWidth>
        {t("student.submit")}
      </Button>
    </form>
  );
}
