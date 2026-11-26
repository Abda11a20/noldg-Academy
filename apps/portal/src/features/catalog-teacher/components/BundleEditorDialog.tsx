import { useTranslation } from "react-i18next";
import { capabilities } from "@noldg/api/config/capabilities";
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  Heading,
  MoneyField,
  SearchField,
  TextField,
} from "@noldg/ui";
import {
  MAX_CATALOG_PRICE_EGP,
  MIN_CATALOG_PRICE_EGP,
  MINIMUM_ANNOUNCED_LESSON_COUNT,
  type CatalogLesson,
  type CatalogProduct,
} from "@noldg/api/contracts/catalog";
import type { BundleFormValues } from "../hooks/useBundlePanelState";

interface BundleEditorDialogProps {
  open: boolean;
  editing: CatalogProduct | undefined;
  form: BundleFormValues;
  lessons: CatalogLesson[];
  search: string;
  pending: boolean;
  valid: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: BundleFormValues) => void;
  onSearchChange: (search: string) => void;
  onToggleLesson: (lessonId: string, checked: boolean | "indeterminate") => void;
  onSave: () => void;
}

/** Renders the controlled create or edit package dialog. @param props Dialog values and events. */
export function BundleEditorDialog(props: BundleEditorDialogProps) {
  const { t } = useTranslation(["catalog"]);
  const updateForm = (field: keyof BundleFormValues, value: string) => {
    props.onFormChange({ ...props.form, [field]: value });
  };
  return (
    <Dialog
      closeLabel={t("catalog:closeDialog")}
      onOpenChange={props.onOpenChange}
      open={props.open}
      title={props.editing ? t("catalog:editBundle") : t("catalog:createBundle")}
    >
      <div className="space-y-4">
        <Heading level={2}>{t("catalog:bundlesTitle")}</Heading>
        {!capabilities.bundleLessons ? (
          <Alert tone="info">{t("catalog:lessonSelectionUnavailable")}</Alert>
        ) : null}
        <TextField
          id="bundle-name"
          label={t("catalog:bundleName")}
          value={props.form.name}
          onChange={(event) => updateForm("name", event.currentTarget.value)}
          required
        />
        <MoneyField
          id="bundle-price"
          label={t("catalog:bundlePrice")}
          max={MAX_CATALOG_PRICE_EGP}
          min={MIN_CATALOG_PRICE_EGP}
          value={props.form.price}
          onChange={(event) => updateForm("price", event.currentTarget.value)}
          required
        />
        <TextField
          id="bundle-count"
          inputMode="numeric"
          label={t("catalog:announcedLessonCount")}
          min={MINIMUM_ANNOUNCED_LESSON_COUNT}
          value={props.form.announcedLessonCount}
          onChange={(event) => updateForm("announcedLessonCount", event.currentTarget.value)}
          required
        />
        {capabilities.bundleLessons ? (
          <fieldset className="space-y-3">
            <legend className="font-medium text-foreground">{t("catalog:chooseLessons")}</legend>
            <SearchField
              label={t("catalog:searchLessons")}
              value={props.search}
              onChange={(event) => props.onSearchChange(event.currentTarget.value)}
            />
            {props.lessons.map((lesson) => (
              <Checkbox
                checked={props.form.lessonIds.includes(lesson.id)}
                id={`bundle-lesson-${lesson.id}`}
                key={lesson.id}
                label={lesson.title}
                onCheckedChange={(checked) => props.onToggleLesson(lesson.id, checked)}
              />
            ))}
            {props.form.lessonIds.length > Number(props.form.announcedLessonCount) ? (
              <p className="text-sm text-danger">{t("catalog:bundleLessonLimit")}</p>
            ) : null}
          </fieldset>
        ) : null}
        <p className="text-sm text-foreground-muted">{t("catalog:studentPricePreviewHint")}</p>
        <div className="flex justify-end gap-3">
          <Button
            disabled={props.pending}
            onClick={() => props.onOpenChange(false)}
            variant="secondary"
          >
            {t("catalog:cancel")}
          </Button>
          <Button
            disabled={props.pending || !props.form.name.trim() || !props.valid}
            loading={props.pending}
            onClick={props.onSave}
          >
            {t("catalog:saveBundle")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
