import type { ListUrlState } from "@noldg/api/contracts/common";
import { Button, SearchField, Select, type SelectOption } from "@noldg/ui";

export interface TracksToolbarProps {
  search: string;
  searchKey: string;
  filters: ListUrlState["filters"];
  systemOptions: readonly SelectOption[];
  stageOptions: readonly SelectOption[];
  activeOptions: readonly SelectOption[];
  labels: {
    search: string;
    system: string;
    stage: string;
    active: string;
    create: string;
    all: string;
  };
  onSearch: (value: string) => void;
  onFilter: (key: string, value: string) => void;
  onCreate: () => void;
}

/** Renders track search, filters, and create action.
 * @param props URL-backed values, labels, options, and events.
 */
export function TracksToolbar({
  search,
  searchKey,
  filters,
  systemOptions,
  stageOptions,
  activeOptions,
  labels,
  onSearch,
  onFilter,
  onCreate,
}: TracksToolbarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <SearchField
        key={searchKey}
        defaultValue={search}
        label={labels.search}
        onChange={(event) => onSearch(event.currentTarget.value)}
      />
      <Select
        id="track-filter-system"
        label={labels.system}
        options={systemOptions}
        value={filters.system ?? ""}
        placeholder={labels.all}
        onValueChange={(value) => onFilter("system", value)}
      />
      <Select
        id="track-filter-stage"
        label={labels.stage}
        options={stageOptions}
        value={filters.stage ?? ""}
        placeholder={labels.all}
        onValueChange={(value) => onFilter("stage", value)}
      />
      <Select
        id="track-filter-active"
        label={labels.active}
        options={activeOptions}
        value={filters.active ?? ""}
        placeholder={labels.all}
        onValueChange={(value) => onFilter("active", value)}
      />
      <Button onClick={onCreate}>{labels.create}</Button>
    </div>
  );
}
