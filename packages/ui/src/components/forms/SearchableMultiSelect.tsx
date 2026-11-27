import { Checkbox } from "./Checkbox";
import { SearchField } from "./SearchField";

export interface SearchableMultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SearchableMultiSelectProps {
  id: string;
  label: string;
  searchLabel: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  options: readonly SearchableMultiSelectOption[];
  selectedValues: readonly string[];
  selectedSummary: string;
  onSelectedValuesChange: (values: readonly string[]) => void;
  emptyLabel: string;
  loadingLabel: string;
  loading?: boolean;
  disabled?: boolean;
}

/** Renders a controlled, keyboard-operable searchable set of labelled checkboxes.
 * @param props Options, selection state, translated states, and change events.
 */
export function SearchableMultiSelect({
  id,
  label,
  searchLabel,
  searchValue,
  onSearchChange,
  options,
  selectedValues,
  selectedSummary,
  onSelectedValuesChange,
  emptyLabel,
  loadingLabel,
  loading = false,
  disabled = false,
}: SearchableMultiSelectProps) {
  function updateSelection(value: string, checked: boolean | "indeterminate"): void {
    const nextValues =
      checked === true
        ? [...selectedValues, value]
        : selectedValues.filter((selected) => selected !== value);
    onSelectedValuesChange(nextValues);
  }

  return (
    <section aria-labelledby={`${id}-label`} className="space-y-3">
      <h2 className="font-medium text-foreground" id={`${id}-label`}>
        {label}
      </h2>
      <SearchField
        id={`${id}-search`}
        label={searchLabel}
        onChange={(event) => onSearchChange(event.currentTarget.value)}
        value={searchValue}
      />
      <p aria-live="polite" className="text-sm text-foreground-muted">
        {selectedSummary}
      </p>
      {loading ? (
        <p aria-live="polite" role="status">
          {loadingLabel}
        </p>
      ) : options.length === 0 ? (
        <p>{emptyLabel}</p>
      ) : (
        <ul aria-label={label} className="max-h-80 space-y-2 overflow-y-auto">
          {options.map((option) => (
            <li key={option.value}>
              <Checkbox
                checked={selectedValues.includes(option.value)}
                disabled={Boolean(disabled || option.disabled)}
                id={`${id}-${option.value}`}
                label={option.label}
                onCheckedChange={(checked) => updateSelection(option.value, checked)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
