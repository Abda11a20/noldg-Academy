import { SearchField, Select } from "@noldg/ui";
import { QUESTION_FILTERS } from "../constants";
import type { QuestionBankLabels } from "../types";

export interface QuestionFiltersProps {
  search: string;
  filters: Record<string, string>;
  disabled: boolean;
  labels: QuestionBankLabels;
  onSearch: (value: string) => void;
  onFilter: (key: string, value: string) => void;
}

/** Renders shareable question filters while leaving URL synchronization to the caller.
 * @param props Current query values, localized labels, capability state, and events.
 */
export function QuestionFilters({
  search,
  filters,
  disabled,
  labels,
  onSearch,
  onFilter,
}: QuestionFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <SearchField
        label={labels.searchLabel}
        placeholder={labels.searchPlaceholder}
        value={search}
        onChange={(event) => onSearch(event.currentTarget.value)}
      />
      {QUESTION_FILTERS.map((filter) => (
        <SearchField
          key={filter}
          label={
            labels[
              filter === "subjectId"
                ? "subjectFilter"
                : filter === "lessonId"
                  ? "lessonFilter"
                  : "courseFilter"
            ]
          }
          placeholder={
            labels[
              filter === "subjectId"
                ? "subjectFilter"
                : filter === "lessonId"
                  ? "lessonFilter"
                  : "courseFilter"
            ]
          }
          value={filters[filter] ?? ""}
          disabled={disabled}
          onChange={(event) => onFilter(filter, event.currentTarget.value)}
        />
      ))}
      <Select
        id="question-difficulty-filter"
        label={labels.difficultyFilter}
        value={filters.difficulty ?? "all"}
        disabled={disabled}
        onValueChange={(value) => onFilter("difficulty", value === "all" ? "" : value)}
        options={[
          { value: "all", label: labels.allDifficulties },
          { value: "easy", label: labels.easy },
          { value: "medium", label: labels.medium },
          { value: "hard", label: labels.hard },
        ]}
        placeholder={labels.allDifficulties}
      />
      <Select
        id="question-status-filter"
        label={labels.statusFilter}
        value={filters.status ?? "all"}
        disabled={disabled}
        onValueChange={(value) => onFilter("status", value === "all" ? "" : value)}
        options={[
          { value: "all", label: labels.allStatuses },
          { value: "active", label: labels.active },
          { value: "archived", label: labels.archived },
        ]}
        placeholder={labels.allStatuses}
      />
    </div>
  );
}
