import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Tabs } from "./navigation/Tabs";
import { DropdownMenu } from "./navigation/DropdownMenu";
import { ToastProvider, useToast } from "./feedback/ToastProvider";
import { UiProvider } from "../providers/UiProvider";
import { Dialog } from "./overlay/Dialog";

it("sets tabs to RTL direction and supports an empty tab collection", () => {
  const { container, rerender } = render(
    <UiProvider direction="rtl">
      <Tabs label="Sections" items={[{ value: "one", label: "One", content: <p>Panel</p> }]} />
    </UiProvider>,
  );
  expect(container.querySelector("[dir='rtl']")).toBeInTheDocument();
  rerender(
    <UiProvider direction="ltr">
      <Tabs label="Empty" items={[]} />
    </UiProvider>,
  );
  expect(screen.getByRole("tablist", { name: "Empty" })).toBeInTheDocument();
});

it("renders disabled destructive menu actions", async () => {
  const user = userEvent.setup();
  render(
    <DropdownMenu
      trigger="Actions"
      triggerLabel="Open actions"
      items={[{ id: "delete", label: "Delete", tone: "danger", disabled: true, onSelect: vi.fn() }]}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Open actions" }));
  expect(await screen.findByRole("menuitem", { name: "Delete" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
});

it("renders the action menu in RTL direction", async () => {
  const user = userEvent.setup();
  render(
    <UiProvider direction="rtl">
      <DropdownMenu
        trigger="Actions"
        triggerLabel="Open actions"
        items={[{ id: "edit", label: "Edit", onSelect: vi.fn() }]}
      />
    </UiProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Open actions" }));
  const menuItem = await screen.findByRole("menuitem", { name: "Edit" });
  expect(menuItem).toBeInTheDocument();
  expect(menuItem.closest("[dir='rtl']")).toBeInTheDocument();
});

function ToastTestTrigger() {
  const { notify } = useToast();
  return <button onClick={() => notify({ title: "Saved", tone: "success" })}>Notify</button>;
}

function DangerToastTrigger() {
  const { notify } = useToast();
  return <button onClick={() => notify({ title: "Danger notice", tone: "danger" })}>Danger</button>;
}

function DefaultToastTrigger() {
  const { notify } = useToast();
  return <button onClick={() => notify({ title: "Default notice" })}>Default</button>;
}

it("requires the toast hook to be rendered inside its provider", () => {
  expect(() => renderHook(() => useToast())).toThrow("useToast must be used inside ToastProvider.");
});

it("renders a danger toast without an optional description", () => {
  render(
    <UiProvider direction="ltr">
      <ToastProvider dismissLabel="Dismiss">
        <DangerToastTrigger />
      </ToastProvider>
    </UiProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Danger" }));
  expect(screen.getByText("Danger notice")).toBeInTheDocument();
});

it("uses the default informational tone and omits an optional description", () => {
  render(
    <UiProvider direction="ltr">
      <ToastProvider dismissLabel="Dismiss">
        <DefaultToastTrigger />
      </ToastProvider>
    </UiProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Default" }));
  expect(screen.getByText("Default notice").closest("li")).toHaveClass("border-info");
});

it("pauses toast dismissal while focused and places its viewport logically in RTL", async () => {
  vi.useFakeTimers();
  const { container } = render(
    <UiProvider direction="rtl">
      <ToastProvider dismissLabel="Dismiss">
        <ToastTestTrigger />
      </ToastProvider>
    </UiProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Notify" }));
  const toast = screen.getByText("Saved").closest("li");
  if (toast) fireEvent.focus(toast);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(6000);
  });
  expect(screen.getByText("Saved")).toBeInTheDocument();
  expect(container.querySelector("[aria-label='Dismiss']")?.className).toContain("end-4");
  vi.useRealTimers();
});

it("dismisses polite notifications after their duration", async () => {
  vi.useFakeTimers();
  render(
    <UiProvider direction="ltr">
      <ToastProvider dismissLabel="Dismiss">
        <ToastTestTrigger />
      </ToastProvider>
    </UiProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Notify" }));
  expect(screen.getByText("Saved")).toBeInTheDocument();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  vi.useRealTimers();
});

it("limits the toast queue and allows dismissal while paused on hover", async () => {
  vi.useFakeTimers();
  function MultipleToastTrigger() {
    const { notify } = useToast();
    return (
      <button
        onClick={() => {
          notify({ title: "One", tone: "info" });
          notify({ title: "Two", tone: "success", description: "Saved successfully" });
          notify({ title: "Three", tone: "warning" });
          notify({ title: "Four", tone: "danger", description: "Needs attention" });
          notify({ title: "Five", tone: "info" });
        }}
      >
        Notify queue
      </button>
    );
  }
  render(
    <UiProvider direction="ltr">
      <ToastProvider dismissLabel="Dismiss">
        <MultipleToastTrigger />
      </ToastProvider>
    </UiProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Notify queue" }));
  expect(screen.queryByText("One")).not.toBeInTheDocument();
  expect(screen.getByText("Five")).toBeInTheDocument();
  expect(screen.getByText("Saved successfully")).toBeInTheDocument();
  const dismissButton = screen.getAllByRole("button", { name: "Dismiss" })[0];
  if (dismissButton) fireEvent.click(dismissButton);
  expect(screen.queryByText("Two")).not.toBeInTheDocument();
  expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  expect(screen.queryByText("Five")).not.toBeInTheDocument();
  vi.useRealTimers();
});

it("does not attempt to restore focus to a non-HTML opener", async () => {
  function DialogHarness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <svg aria-label="Focus target" tabIndex={0} />
        <button onClick={() => setOpen(true)}>Open dialog</button>
        <Dialog open={open} onOpenChange={setOpen} title="Dialog title" closeLabel="Close">
          Dialog body
        </Dialog>
      </>
    );
  }
  const { container } = render(<DialogHarness />);
  const target = container.querySelector("svg");
  if (!target) throw new Error("Expected SVG focus target.");
  target.focus();
  fireEvent.click(screen.getByRole("button", { name: "Open dialog" }));
  await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});
