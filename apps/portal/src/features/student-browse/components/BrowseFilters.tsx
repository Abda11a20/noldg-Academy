import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Checkbox, Dialog, SearchField, Select } from "@noldg/ui";
import {
  STUDENT_BROWSE_RATINGS,
  STUDENT_BROWSE_SORTS,
  STUDENT_BROWSE_SUBJECTS,
} from "../constants";

interface BrowseFiltersProps {
  disabled?: boolean;
  search: string;
  subjectId: string;
  minRating: string;
  hasFreeLessons: boolean;
  sort: string;
  onSearch: (value: string) => void;
  onSubject: (value: string) => void;
  onRating: (value: string) => void;
  onFreeLessons: (checked: boolean) => void;
  onSort: (value: string) => void;
}

/** Renders translated teacher filters with a compact mobile dialog variant. */
export function BrowseFilters(props: BrowseFiltersProps) {
  const { t } = useTranslation("browse");
  const [open, setOpen] = useState(false);
  const disabled = props.disabled ?? false;
  const controls = (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <SearchField
        id="browse-search"
        label={t("searchLabel")}
        placeholder={t("searchPlaceholder")}
        value={props.search}
        disabled={disabled}
        onChange={(event) => props.onSearch(event.currentTarget.value)}
      />
      <Select
        id="browse-subject"
        label={t("subjectFilter")}
        placeholder={t("anySubject")}
        value={props.subjectId}
        disabled={disabled}
        options={STUDENT_BROWSE_SUBJECTS.map((item) => ({
          value: item.id,
          label: t(item.labelKey),
        }))}
        onValueChange={props.onSubject}
      />
      <Select
        id="browse-rating"
        label={t("ratingFilter")}
        placeholder={t("anyRating")}
        value={props.minRating}
        disabled={disabled}
        options={STUDENT_BROWSE_RATINGS.map((value) => ({
          value,
          label: t("minimumRating", { value }),
        }))}
        onValueChange={props.onRating}
      />
      <Checkbox
        id="browse-free"
        label={t("freeFilter")}
        checked={props.hasFreeLessons}
        disabled={disabled}
        onCheckedChange={(checked) => props.onFreeLessons(checked === true)}
      />
      <Select
        id="browse-sort"
        label={t("sortLabel")}
        value={props.sort}
        disabled={disabled}
        options={STUDENT_BROWSE_SORTS.map((value) => ({ value, label: t(`sort.${value}`) }))}
        placeholder={t("sortLabel")}
        onValueChange={props.onSort}
      />
    </div>
  );
  return (
    <>
      <div className="hidden md:block">{controls}</div>
      <div className="md:hidden">
        <Button variant="secondary" disabled={disabled} onClick={() => setOpen(true)}>
          {t("openFilters")}
        </Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title={t("filtersTitle")}
          closeLabel={t("closeFilters")}
        >
          <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto">
            <div className="grid gap-4">{controls}</div>
          </div>
        </Dialog>
      </div>
    </>
  );
}
