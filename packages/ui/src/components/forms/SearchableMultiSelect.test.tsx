import { axe } from "jest-axe";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { expect, it, vi } from "vitest";
import { SearchableMultiSelect } from "./SearchableMultiSelect";

const options = [
  { value: "algebra", label: "Algebra" },
  { value: "geometry", label: "Geometry", disabled: true },
  { value: "fractions", label: "Fractions" },
];

function renderSelect(overrides: Partial<ComponentProps<typeof SearchableMultiSelect>> = {}) {
  return render(
    <SearchableMultiSelect
      emptyLabel="No questions"
      id="questions"
      label="Questions"
      loadingLabel="Loading questions"
      onSearchChange={vi.fn()}
      onSelectedValuesChange={vi.fn()}
      options={options}
      searchLabel="Search questions"
      searchValue=""
      selectedSummary="One selected"
      selectedValues={["algebra"]}
      {...overrides}
    />,
  );
}

it("renders selected summary and accessible options with keyboard interaction", async () => {
  const user = userEvent.setup();
  const onSelectedValuesChange = vi.fn();
  const onSearchChange = vi.fn();
  renderSelect({ onSelectedValuesChange, onSearchChange });
  expect(screen.getByText("One selected")).toHaveAttribute("aria-live", "polite");
  await user.click(screen.getByRole("checkbox", { name: "Algebra" }));
  expect(onSelectedValuesChange).toHaveBeenCalledWith([]);
  await user.click(screen.getByRole("checkbox", { name: "Fractions" }));
  expect(onSelectedValuesChange).toHaveBeenLastCalledWith(["algebra", "fractions"]);
  expect(screen.getByRole("checkbox", { name: "Geometry" })).toBeDisabled();
  await user.type(screen.getByRole("searchbox", { name: "Search questions" }), "linear");
  expect(onSearchChange).toHaveBeenCalled();
});

it("renders loading and empty states and honors whole-control disabled", () => {
  const { rerender } = renderSelect({ loading: true });
  expect(screen.getByRole("status")).toHaveTextContent("Loading questions");
  rerender(
    <SearchableMultiSelect
      emptyLabel="No questions"
      id="questions"
      label="Questions"
      loadingLabel="Loading questions"
      onSearchChange={vi.fn()}
      onSelectedValuesChange={vi.fn()}
      options={[]}
      searchLabel="Search questions"
      searchValue=""
      selectedSummary="None selected"
      selectedValues={[]}
    />,
  );
  expect(screen.getByText("No questions")).toBeInTheDocument();
  rerender(
    <SearchableMultiSelect
      disabled
      emptyLabel="No questions"
      id="questions"
      label="Questions"
      loadingLabel="Loading questions"
      onSearchChange={vi.fn()}
      onSelectedValuesChange={vi.fn()}
      options={options}
      searchLabel="Search questions"
      searchValue=""
      selectedSummary="None selected"
      selectedValues={[]}
    />,
  );
  expect(screen.getByRole("checkbox", { name: "Algebra" })).toBeDisabled();
});

it("has no axe violations in RTL", async () => {
  const { container } = render(
    <div dir="rtl">
      <SearchableMultiSelect
        emptyLabel="No questions"
        id="questions"
        label="Questions"
        loadingLabel="Loading questions"
        onSearchChange={vi.fn()}
        onSelectedValuesChange={vi.fn()}
        options={options}
        searchLabel="Search questions"
        searchValue=""
        selectedSummary="One selected"
        selectedValues={["algebra"]}
      />
    </div>,
  );
  expect((await axe(container)).violations).toHaveLength(0);
});
