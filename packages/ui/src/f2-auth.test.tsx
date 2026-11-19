import { axe } from "jest-axe";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Chip } from "./components/data-display/Chip";
import { OtpInput } from "./components/forms/OtpInput";
import { Topbar } from "./components/navigation/Topbar";

const digitLabels = Array.from({ length: 6 }, (_, index) => `Digit ${index + 1}`);
const normalizeDigits = (value: string) =>
  value.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

it("supports RTL code entry, paste, advance and backspace with an accessible OTP group", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  const { container } = render(
    <div dir="rtl">
      <OtpInput
        digitLabels={digitLabels}
        groupLabel="Verification code"
        normalizeDigits={normalizeDigits}
        onChange={onChange}
        value=""
      />
    </div>,
  );
  const fields = screen.getAllByRole("textbox");
  expect(fields).toHaveLength(6);
  const firstField = fields[0];
  const secondField = fields[1];
  if (!firstField || !secondField) throw new Error("OTP input must render six fields.");
  expect(firstField).toHaveAttribute("autocomplete", "one-time-code");
  expect(firstField.closest("[dir='ltr']")).toBeTruthy();
  await user.type(firstField, "1");
  expect(secondField).toHaveFocus();
  await user.keyboard("{Backspace}");
  expect(firstField).toHaveFocus();
  fireEvent.paste(firstField, { clipboardData: { getData: () => "١٢٣٤٥٦" } });
  expect(onChange).toHaveBeenLastCalledWith("123456");
  const lastField = fields.at(-1);
  if (!lastField) throw new Error("OTP input must render six fields.");
  await user.type(lastField, "7");
  expect(lastField).toHaveFocus();
  const changeCount = onChange.mock.calls.length;
  fireEvent.paste(secondField, { clipboardData: { getData: () => "" } });
  expect(onChange).toHaveBeenCalledTimes(changeCount);
  expect((await axe(container)).violations).toHaveLength(0);
});

it("renders and removes a selection chip accessibly", async () => {
  const user = userEvent.setup();
  const onRemove = vi.fn();
  const { container } = render(
    <Chip onRemove={onRemove} removeLabel="Remove Arabic">
      Arabic
    </Chip>,
  );
  screen.getByRole("button", { name: "Remove Arabic" }).focus();
  await user.keyboard("{Enter}");
  expect(onRemove).toHaveBeenCalledOnce();
  expect((await axe(container)).violations).toHaveLength(0);
});

it("renders the shared topbar slots, identity, and logout action accessibly", async () => {
  const user = userEvent.setup();
  const onLogout = vi.fn();
  const { container } = render(
    <Topbar
      languageSwitchSlot={<button type="button">Language</button>}
      logoAlt="Noldg Academy"
      logoutLabel="Log out"
      onLogout={onLogout}
      roleLabel="Student"
      userName="Mona Ali"
    />,
  );
  screen.getByRole("button", { name: "Log out" }).focus();
  await user.keyboard("{Enter}");
  expect(onLogout).toHaveBeenCalledOnce();
  expect(screen.getByText("Mona Ali")).toBeVisible();
  expect((await axe(container)).violations).toHaveLength(0);
});

it("allows the topbar identity, menu, and logout actions to be omitted", async () => {
  const { container } = render(
    <Topbar logoAlt="Noldg Academy" userMenuSlot={<span>Profile menu</span>} />,
  );
  expect(screen.getByText("Profile menu")).toBeVisible();
  expect(screen.queryByText("Mona Ali")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument();
  expect((await axe(container)).violations).toHaveLength(0);
});
