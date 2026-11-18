import { useTranslation } from "react-i18next";
import {
  Checkbox,
  FileDropzone,
  Grid,
  Heading,
  PasswordField,
  RadioGroup,
  SearchField,
  Select,
  Stack,
  Switch,
  Textarea,
  TextField,
} from "@noldg/ui";

interface GalleryFormsProps {
  direction: "rtl" | "ltr";
}

/** Shows translated form components and representative validation states. */
export function GalleryForms({ direction }: GalleryFormsProps) {
  const { t } = useTranslation("common");
  const prefix = direction === "rtl" ? "rtl" : "ltr";
  const options = [
    { value: "math", label: t("sampleOptionMath") },
    { value: "science", label: t("sampleOptionScience") },
  ];

  return (
    <section aria-label={t("galleryForms")}>
      <Heading level={3}>{t("galleryForms")}</Heading>
      <Grid className="mt-4" columns={2}>
        <TextField id={`${prefix}-name`} label={t("sampleName")} hint={t("sampleHint")} />
        <TextField
          id={`${prefix}-name-error`}
          label={t("sampleName")}
          error={t("sampleError")}
          required
        />
        <TextField disabled id={`${prefix}-name-disabled`} label={t("sampleName")} />
        <PasswordField
          id={`${prefix}-password`}
          label={t("samplePassword")}
          showLabel={t("showPassword")}
          hideLabel={t("hidePassword")}
        />
        <SearchField label={t("sampleSearch")} />
        <Textarea
          id={`${prefix}-message`}
          label={t("sampleMessage")}
          maxLength={100}
          showCharacterCount
          defaultValue={t("sampleAlertBody")}
        />
        <Select
          id={`${prefix}-select`}
          label={t("sampleSelect")}
          options={options}
          placeholder={t("sampleSelect")}
          defaultValue="math"
        />
        <Stack>
          <Checkbox id={`${prefix}-checkbox`} label={t("sampleCheck")} defaultChecked />
          <RadioGroup
            id={`${prefix}-radio`}
            label={t("sampleRadio")}
            options={[
              { value: "online", label: t("sampleOnline") },
              { value: "person", label: t("sampleInPerson") },
            ]}
            defaultValue="online"
          />
          <Switch id={`${prefix}-switch`} label={t("sampleSwitch")} defaultChecked />
        </Stack>
        <FileDropzone
          accept="image/*,.pdf"
          description={t("sampleDropDescription")}
          files={[]}
          label={t("sampleDropzone")}
          maximumSize={t("sampleFileSize")}
        />
      </Grid>
    </section>
  );
}
