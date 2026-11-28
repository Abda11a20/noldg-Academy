import { axe } from "jest-axe";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { NumberField } from "./NumberField";

it("renders integer range, hint, and an associated validation error", () => {
  render(
    <NumberField
      error="Choose a valid count"
      hint="Between one and five"
      id="question-count"
      label="Question count"
      max={5}
      min={1}
    />,
  );
  const input = screen.getByLabelText("Question count");
  expect(input).toHaveAttribute("type", "number");
  expect(input).toHaveAttribute("step", "1");
  expect(input).toHaveAttribute("min", "1");
  expect(input).toHaveAttribute("max", "5");
  expect(input).toHaveAttribute("aria-invalid", "true");
});

it("emits changed values and supports RTL layout", () => {
  const onChange = vi.fn();
  render(
    <div dir="rtl">
      <NumberField id="count" label="العدد" max={5} min={1} onChange={onChange} value={2} />
    </div>,
  );
  fireEvent.change(screen.getByLabelText("العدد"), { target: { value: "3" } });
  expect(onChange).toHaveBeenCalledOnce();
  expect(screen.getByLabelText("العدد").closest("[dir='rtl']")).not.toBeNull();
});

it("has no axe violations", async () => {
  const { container } = render(<NumberField id="count" label="Count" max={10} min={0} />);
  expect((await axe(container)).violations).toHaveLength(0);
});
