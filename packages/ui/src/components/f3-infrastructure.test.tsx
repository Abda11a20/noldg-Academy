import { axe } from "jest-axe";
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Dialog } from "./overlay/Dialog";
import { ConfirmDialog } from "./overlay/ConfirmDialog";
import { Tabs } from "./navigation/Tabs";
import { DropdownMenu } from "./navigation/DropdownMenu";
import { UiProvider } from "../providers/UiProvider";

const dialogLabels = {
  title: "Dialog title",
  description: "Dialog description",
  close: "Close",
  cancel: "Cancel",
  confirm: "Confirm",
  reason: "Reason",
};

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

it("returns focus to the opener after the dialog closes", async () => {
  const user = userEvent.setup();
  function DialogHarness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Open dialog</button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title={dialogLabels.title}
          closeLabel={dialogLabels.close}
        >
          {dialogLabels.description}
        </Dialog>
      </>
    );
  }
  render(<DialogHarness />);
  const opener = screen.getByRole("button", { name: "Open dialog" });
  await user.click(opener);
  await user.keyboard("{Escape}");
  await waitFor(() => expect(opener).toHaveFocus());
});

it("closes safely when the dialog opener was removed while it was open", async () => {
  const user = userEvent.setup();
  function DialogHarness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        {!open ? <button onClick={() => setOpen(true)}>Open dialog</button> : null}
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title={dialogLabels.title}
          closeLabel={dialogLabels.close}
        >
          {dialogLabels.description}
        </Dialog>
      </>
    );
  }
  render(<DialogHarness />);
  await user.click(screen.getByRole("button", { name: "Open dialog" }));
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
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

it("rejects confirmation events that bypass the disabled reason control", () => {
  const onConfirm = vi.fn();
  render(
    <ConfirmDialog
      open
      onOpenChange={() => undefined}
      title={dialogLabels.title}
      closeLabel={dialogLabels.close}
      confirmLabel={dialogLabels.confirm}
      cancelLabel={dialogLabels.cancel}
      reason={{ id: "reason", label: dialogLabels.reason, minimumLength: 5 }}
      onConfirm={onConfirm}
    />,
  );
  const confirm = screen.getByRole("button", { name: dialogLabels.confirm });
  (confirm as HTMLButtonElement).disabled = false;
  const reactPropsKey = Object.keys(confirm).find((key) => key.startsWith("__reactProps"));
  if (!reactPropsKey)
    throw new Error("Expected the React click handler on the confirmation button.");
  const reactProps = (confirm as unknown as Record<string, { onClick?: () => void }>)[
    reactPropsKey
  ];
  if (!reactProps) throw new Error("Expected React event props on the confirmation button.");
  reactProps.onClick?.();
  expect(onConfirm).not.toHaveBeenCalled();
});

it("renders a required reason without an optional hint", () => {
  render(
    <ConfirmDialog
      open
      onOpenChange={() => undefined}
      title={dialogLabels.title}
      closeLabel={dialogLabels.close}
      confirmLabel={dialogLabels.confirm}
      cancelLabel={dialogLabels.cancel}
      reason={{ id: "reason", label: dialogLabels.reason, minimumLength: 5 }}
      onConfirm={() => undefined}
    />,
  );
  expect(screen.getByLabelText(dialogLabels.reason)).toBeInTheDocument();
});

it("renders an optional hint with a required reason", () => {
  render(
    <ConfirmDialog
      open
      onOpenChange={() => undefined}
      title={dialogLabels.title}
      closeLabel={dialogLabels.close}
      confirmLabel={dialogLabels.confirm}
      cancelLabel={dialogLabels.cancel}
      reason={{
        id: "reason-with-hint",
        label: dialogLabels.reason,
        hint: "Explain why this action is needed",
        minimumLength: 5,
      }}
      onConfirm={() => undefined}
    />,
  );
  expect(screen.getByText("Explain why this action is needed")).toBeInTheDocument();
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

it("supports opening a deferred action menu through controlled state", async () => {
  const user = userEvent.setup();
  const onOpenChange = vi.fn();
  render(
    <DropdownMenu
      trigger="Actions"
      triggerLabel="Open actions"
      items={[{ id: "edit", label: "Edit", onSelect: vi.fn() }]}
      open
      onOpenChange={onOpenChange}
    />,
  );
  expect(await screen.findByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(onOpenChange).toHaveBeenCalledWith(false);
});
