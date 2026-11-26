import { DateTimeField, Switch, TextField } from "@noldg/ui";
import { useTranslation } from "react-i18next";
import { tryCairoLocalToIso, tryIsoToCairoLocal } from "../../../shared/time/time";

interface AdminOrderFiltersProps {
  filters: Record<string, string>;
  onChange: (filters: Record<string, string>) => void;
}

function setUrlFilter(filters: Record<string, string>, key: string, value: string) {
  const next = { ...filters };
  if (value) next[key] = value;
  else delete next[key];
  return next;
}

/** Renders administrator queue filters while storing date bounds as UTC URL values.
 * @param props URL-backed filter state and update callback.
 */
export function AdminOrderFilters({ filters, onChange }: AdminOrderFiltersProps) {
  const { t } = useTranslation("orders");
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <TextField
        id="orders-teacher-filter"
        label={t("teacherFilter")}
        value={filters.teacherId ?? ""}
        onChange={(event) =>
          onChange(setUrlFilter(filters, "teacherId", event.currentTarget.value))
        }
      />
      <DateTimeField
        id="orders-from-filter"
        label={t("fromDate")}
        value={filters.from ? (tryIsoToCairoLocal(filters.from) ?? "") : ""}
        onChange={(event) => {
          const from = tryCairoLocalToIso(event.currentTarget.value);
          onChange(setUrlFilter(filters, "from", from ?? ""));
        }}
      />
      <DateTimeField
        id="orders-to-filter"
        label={t("toDate")}
        value={filters.to ? (tryIsoToCairoLocal(filters.to) ?? "") : ""}
        onChange={(event) => {
          const to = tryCairoLocalToIso(event.currentTarget.value);
          onChange(setUrlFilter(filters, "to", to ?? ""));
        }}
      />
      <Switch
        id="orders-expiring-filter"
        label={t("expiringSoon")}
        checked={filters.expiringSoon === "true"}
        onCheckedChange={(checked) => onChange(setFlagFilter(filters, checked))}
      />
    </div>
  );
}

function setFlagFilter(filters: Record<string, string>, enabled: boolean) {
  const next = { ...filters };
  if (enabled) next.expiringSoon = "true";
  else delete next.expiringSoon;
  return next;
}
