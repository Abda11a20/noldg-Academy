import { axe } from "jest-axe";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { OrderList } from "./OrderList";

const labels = {
  moveUpLabel: (name: string) => `Move ${name} up`,
  moveDownLabel: (name: string) => `Move ${name} down`,
  removeLabel: (name: string) => `Remove ${name}`,
};

it("supports keyboard-accessible reordering and removal", async () => {
  const user = userEvent.setup();
  const onMove = vi.fn();
  const onRemove = vi.fn();
  render(
    <OrderList
      {...labels}
      emptyLabel="No questions"
      items={[
        { id: "one", label: "One" },
        { id: "two", label: "Two" },
      ]}
      label="Question order"
      onMove={onMove}
      onRemove={onRemove}
    />,
  );
  expect(screen.getByRole("button", { name: "Move One up" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Move Two down" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Move One down" }));
  await user.click(screen.getByRole("button", { name: "Move Two up" }));
  await user.click(screen.getByRole("button", { name: "Remove Two" }));
  expect(onMove).toHaveBeenCalledWith(0, "down");
  expect(onMove).toHaveBeenCalledWith(1, "up");
  expect(onRemove).toHaveBeenCalledWith("two");
});

it("shows its empty state and has no RTL axe violations", async () => {
  const { container, rerender } = render(
    <OrderList
      {...labels}
      emptyLabel="No questions"
      items={[]}
      label="Question order"
      onMove={vi.fn()}
      onRemove={vi.fn()}
    />,
  );
  expect(screen.getByText("No questions")).toBeInTheDocument();
  rerender(
    <div dir="rtl">
      <OrderList
        {...labels}
        emptyLabel="No questions"
        items={[{ id: "one", label: "سؤال" }]}
        label="ترتيب الأسئلة"
        onMove={vi.fn()}
        onRemove={vi.fn()}
      />
    </div>,
  );
  expect((await axe(container)).violations).toHaveLength(0);
});
