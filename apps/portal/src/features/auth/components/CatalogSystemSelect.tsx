import { useTranslation } from "react-i18next";
import { Select, type SelectOption } from "@noldg/ui";

export interface CatalogSystemSelectProps {
  systems: readonly string[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  id: string;
}

/** Renders catalog system choices using the shared Select. @param props Systems, current selection, and localized labels. */
export function CatalogSystemSelect({
  systems,
  value,
  onChange,
  label,
  id,
}: CatalogSystemSelectProps) {
  const { t } = useTranslation("auth");
  const options: SelectOption[] = systems.map((system) => ({
    value: system,
    label: t(`systemNames.${system}`, { defaultValue: system }),
  }));
  return (
    <Select
      id={id}
      label={label}
      options={options}
      onValueChange={onChange}
      placeholder={t("selectPlaceholder")}
      {...(value ? { value } : {})}
    />
  );
}
