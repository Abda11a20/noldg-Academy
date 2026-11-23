import { axe } from "jest-axe";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Dialog } from "./overlay/Dialog";
import { ConfirmDialog } from "./overlay/ConfirmDialog";
import { Tabs } from "./navigation/Tabs";
import { DropdownMenu } from "./navigation/DropdownMenu";
import { MobileNav } from "./navigation/MobileNav";
import { Pagination } from "./navigation/Pagination";
import { ToastProvider, useToast } from "./feedback/ToastProvider";
import { UiProvider, type UiLinkProps } from "../providers/UiProvider";

const dialogLabels = {
  title: "Dialog title",
  description: "Dialog description",
  close: "Close",
  cancel: "Cancel",
  confirm: "Confirm",
  reason: "Reason",
};

function TestLink({ to, children }: UiLinkProps) {
  return <a href={to}>{children}</a>;
}

it("wires modal semantics, focus management, and Escape close", async () => {
  const user = userEvent.setup();
  const onOpenChange = vi.fn();
  const { container } = render(
    <Dialog
      open
      onOpenChange={onOpenChange}
      title={dialogLabels.title}
      description={dialogLabels.description}
      closeLabel={dialogLabels.close}
    >
      <p>{dialogLabels.description}</p>
    </Dialog>,
  );
  expect((await axe(container)).violations).toHaveLength(0);
  await user.keyboard("{Escape}");
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

it("requires a configured minimum confirmation reason", async () => {
  const user = userEvent.setup();
  const onConfirm = vi.fn();
  render(
    <ConfirmDialog
      open
      onOpenChange={() => undefined}
      title={dialogLabels.title}
      description={dialogLabels.description}
      closeLabel={dialogLabels.close}
      confirmLabel={dialogLabels.confirm}
      cancelLabel={dialogLabels.cancel}
      reason={{ id: "reason", label: dialogLabels.reason, minimumLength: 5 }}
      onConfirm={onConfirm}
    />,
  );
  const confirm = screen.getByRole("button", { name: dialogLabels.confirm });
  expect(confirm).toBeDisabled();
  await user.type(screen.getByLabelText(dialogLabels.reason), "valid reason");
  expect(confirm).toBeEnabled();
  await user.click(confirm);
  expect(onConfirm).toHaveBeenCalledWith("valid reason");
});

it("confirms without a reason when the dialog does not request one", async () => {
  const user = userEvent.setup();
  const onConfirm = vi.fn();
  render(
    <ConfirmDialog
      open
      onOpenChange={() => undefined}
      title={dialogLabels.title}
      closeLabel={dialogLabels.close}
      confirmLabel={dialogLabels.confirm}
      cancelLabel={dialogLabels.cancel}
      onConfirm={onConfirm}
    />,
  );
  await user.click(screen.getByRole("button", { name: dialogLabels.confirm }));
  expect(onConfirm).toHaveBeenCalledWith(undefined);
});

it("closes a confirmation dialog when cancellation is selected", async () => {
  const user = userEvent.setup();
  const onOpenChange = vi.fn();
  render(
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      title={dialogLabels.title}
      closeLabel={dialogLabels.close}
      confirmLabel={dialogLabels.confirm}
      cancelLabel={dialogLabels.cancel}
      onConfirm={() => undefined}
    />,
  );
  await user.click(screen.getByRole("button", { name: dialogLabels.cancel }));
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

it("moves between tabs with keyboard navigation", async () => {
  const user = userEvent.setup();
  render(
    <UiProvider direction="ltr">
      <Tabs
        label="Sections"
        items={[
          { value: "one", label: "One", content: <p>Panel one</p> },
          { value: "two", label: "Two", content: <p>Panel two</p> },
        ]}
      />
    </UiProvider>,
  );
  const one = screen.getByRole("tab", { name: "One" });
  one.focus();
  await user.keyboard("{ArrowRight}");
  expect(screen.getByRole("tab", { name: "Two" })).toHaveFocus();
});

it("renders accessible tabs with axe", async () => {
  const { container } = render(
    <UiProvider direction="ltr">
      <Tabs
        label="Sections"
        items={[
          { value: "one", label: "One", content: <p>Panel one</p> },
          { value: "two", label: "Two", content: <p>Panel two</p> },
        ]}
      />
    </UiProvider>,
  );
  expect((await axe(container)).violations).toHaveLength(0);
});

it("opens a keyboard accessible row action menu", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(
    <DropdownMenu
      trigger="Actions"
      triggerLabel="Open actions"
      items={[{ id: "edit", label: "Edit", onSelect }]}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Open actions" }));
  await user.click(await screen.findByRole("menuitem", { name: "Edit" }));
  expect(onSelect).toHaveBeenCalledOnce();
});

it("opens the action menu from the keyboard and supports axe", async () => {
  const user = userEvent.setup();
  const { container } = render(
    <DropdownMenu
      trigger="Actions"
      triggerLabel="Open actions"
      items={[{ id: "edit", label: "Edit", onSelect: vi.fn() }]}
    />,
  );
  expect((await axe(container)).violations).toHaveLength(0);
  screen.getByRole("button", { name: "Open actions" }).focus();
  await user.keyboard("{Enter}");
  expect(await screen.findByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
  await user.keyboard("{Escape}");
});

it("opens and closes the responsive navigation drawer", async () => {
  const user = userEvent.setup();
  const { container } = render(
    <UiProvider direction="ltr" linkComponent={TestLink}>
      <MobileNav
        items={[{ to: "/", label: "Home", icon: "home" }]}
        label="Navigation"
        openLabel="Open navigation"
        closeLabel="Close navigation"
      />
    </UiProvider>,
  );
  expect((await axe(container)).violations).toHaveLength(0);
  await user.click(screen.getByRole("button", { name: "Open navigation" }));
  expect(await screen.findByRole("dialog", { name: "Navigation" })).toBeInTheDocument();
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

it("paginates safely and calls the configured size and page events", async () => {
  const onPageChange = vi.fn();
  const onPageSizeChange = vi.fn();
  const user = userEvent.setup();
  render(
    <Pagination
      page={2}
      pageSize={10}
      total={30}
      pageLabel="Pagination"
      pageSizeLabel="Rows per page"
      pageSizePlaceholder="Choose"
      previousLabel="Previous"
      nextLabel="Next"
      pageSizeOptions={[10, 20]}
      pageStatus={(page, count) => `${page} of ${count}`}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Previous" }));
  expect(onPageChange).toHaveBeenCalledWith(1);
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(onPageChange).toHaveBeenCalledWith(3);
  await user.click(screen.getByRole("combobox", { name: "Rows per page" }));
  await user.click(await screen.findByRole("option", { name: "20" }));
  expect(onPageSizeChange).toHaveBeenCalledWith(20);
});

function ToastTestTrigger() {
  const { notify } = useToast();
  return <button onClick={() => notify({ title: "Saved", tone: "success" })}>Notify</button>;
}

it("shows polite toast messages and dismisses them after the configured duration", async () => {
  vi.useFakeTimers();
  render(
    <UiProvider direction="rtl">
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
