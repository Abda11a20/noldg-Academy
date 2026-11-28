import { axe } from "jest-axe";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { FileDropzone } from "./components/forms/FileDropzone";
import { PasswordField } from "./components/forms/PasswordField";
import { SearchField } from "./components/forms/SearchField";
import { Textarea } from "./components/forms/Textarea";
import { TextField } from "./components/forms/TextField";
import { Checkbox } from "./components/forms/Checkbox";
import { RadioGroup } from "./components/forms/RadioGroup";
import { Select } from "./components/forms/Select";
import { Switch } from "./components/forms/Switch";
it("wires field labels, descriptions, errors, password toggle, search, and character count", async () => {
  const user = userEvent.setup();
  const { container } = render(
    <>
      <TextField error="Required" hint="Use your profile name" id="name" label="Name" />
      <TextField id="required-name" label="Required name" required />
      <PasswordField
        id="password"
        label="Password"
        showLabel="Show password"
        hideLabel="Hide password"
        hint="Use a secure phrase"
        error="Too short"
        required
      />
      <PasswordField
        id="plain-password"
        label="Plain password"
        showLabel="Show password"
        hideLabel="Hide password"
      />
      <SearchField label="Search courses" />
      <Textarea
        defaultValue="hello"
        error="Invalid"
        hint="Keep it brief"
        id="message"
        label="Message"
        maxLength={20}
        showCharacterCount
      />
      <Textarea
        id="controlled-message"
        label="Controlled message"
        onChange={() => undefined}
        showCharacterCount
        value="text"
      />
      <Textarea id="empty-message" label="Empty message" />
    </>,
  );
  expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByLabelText("Name")).toHaveAttribute("aria-describedby", "name-hint name-error");
  const password = screen.getByLabelText("Password");
  expect(password).toHaveAttribute("type", "password");
  await user.click(screen.getAllByRole("button", { name: "Show password" })[0]!);
  expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
  const keyboardToggle = screen.getByRole("button", { name: "Show password" });
  keyboardToggle.focus();
  await user.keyboard("{Enter}");
  expect(screen.getByLabelText("Plain password")).toHaveAttribute("type", "text");
  expect(screen.getByText("5 / 20")).toBeVisible();
  expect((await axe(container)).violations).toHaveLength(0);
});

it("supports Radix select, checkbox, radio, and switch keyboard and controlled states", async () => {
  const user = userEvent.setup();
  const changed = vi.fn();
  const { container, unmount } = render(
    <>
      <Select
        id="subject"
        label="Subject"
        options={[
          { value: "math", label: "Math" },
          { value: "science", label: "Science", disabled: true },
        ]}
        placeholder="Choose"
        onValueChange={changed}
      />
      <Checkbox id="terms" label="Agree" />
      <RadioGroup
        id="mode"
        label="Mode"
        options={[
          { value: "online", label: "Online" },
          { value: "room", label: "In person" },
        ]}
        defaultValue="online"
      />
      <Switch id="notice" label="Notifications" />
    </>,
  );
  await user.click(screen.getByRole("combobox", { name: "Subject" }));
  await user.keyboard("{ArrowDown}{Enter}");
  expect(changed).toHaveBeenCalledWith("math");
  await user.click(screen.getByRole("checkbox", { name: "Agree" }));
  expect(screen.getByRole("checkbox", { name: "Agree" })).toBeChecked();
  screen.getByRole("checkbox", { name: "Agree" }).focus();
  await user.keyboard(" ");
  expect(screen.getByRole("checkbox", { name: "Agree" })).not.toBeChecked();
  await user.click(screen.getByRole("radio", { name: "In person" }));
  expect(screen.getByRole("radio", { name: "In person" })).toBeChecked();
  screen.getByRole("radio", { name: "Online" }).focus();
  await user.keyboard("{ArrowDown}");
  expect(screen.getByRole("radio", { name: "In person" })).toBeChecked();
  await user.click(screen.getByRole("switch", { name: "Notifications" }));
  expect(screen.getByRole("switch", { name: "Notifications" })).toHaveAttribute(
    "data-state",
    "checked",
  );
  screen.getByRole("switch", { name: "Notifications" }).focus();
  await user.keyboard(" ");
  expect(screen.getByRole("switch", { name: "Notifications" })).toHaveAttribute(
    "data-state",
    "unchecked",
  );
  expect((await axe(container)).violations).toHaveLength(0);
  unmount();
  const controlled = render(
    <>
      <Select
        disabled
        error="Invalid"
        hint="Choose one"
        id="disabled-subject"
        label="Subject"
        options={[]}
        placeholder="Choose"
        value=""
      />
      <RadioGroup disabled id="disabled-mode" label="Mode" options={[]} orientation="horizontal" />
      <Checkbox checked id="controlled-terms" label="Controlled" onCheckedChange={changed} />
      <Switch
        checked
        id="controlled-notice"
        label="Controlled notifications"
        onCheckedChange={changed}
      />
    </>,
  );
  await user.click(screen.getByRole("checkbox", { name: "Controlled" }));
  expect(changed).toHaveBeenCalledWith(false);
  await user.click(screen.getByRole("switch", { name: "Controlled notifications" }));
  expect(changed).toHaveBeenCalledWith(false);
  expect((await axe(controlled.container)).violations).toHaveLength(0);
});

it("emits selected drop files and displays supplied progress and errors", async () => {
  const onFilesSelected = vi.fn();
  const { container, rerender } = render(
    <FileDropzone
      accept="image/*"
      description="Choose a file"
      files={[{ name: "photo.png", size: "1 MB", progress: 40, error: "Too large" }]}
      label="Upload file"
      maximumSize="10 MB"
      onFilesSelected={onFilesSelected}
    />,
  );
  const input = container.querySelector("input[type=file]");
  expect(input).toHaveAttribute("accept", "image/*");
  expect(input).not.toHaveAttribute("multiple");
  expect(screen.getByText("Too large")).toBeVisible();
  expect(screen.getByRole("progressbar", { name: "photo.png" })).toHaveAttribute("value", "40");
  const file = new File(["content"], "photo.png", { type: "image/png" });
  fireEvent.change(input as HTMLInputElement, { target: { files: [file] } });
  expect(onFilesSelected).toHaveBeenCalled();
  expect((await axe(container)).violations).toHaveLength(0);
  rerender(
    <FileDropzone
      description="Choose a file"
      files={[]}
      label="Upload file"
      maximumSize="10 MB"
      multiple
    />,
  );
  expect(container.querySelector("input[type=file]")).toHaveAttribute("multiple");
  expect(screen.queryByRole("list")).not.toBeInTheDocument();
  fireEvent.dragEnter(screen.getByRole("group", { name: "Upload file" }));
  fireEvent.dragOver(screen.getByRole("group", { name: "Upload file" }));
  expect(screen.getByRole("group", { name: "Upload file" })).toHaveClass("border-primary");
  fireEvent.dragLeave(screen.getByRole("group", { name: "Upload file" }));
  const clickSpy = vi
    .spyOn(HTMLInputElement.prototype, "click")
    .mockImplementation(() => undefined);
  fireEvent.click(screen.getByRole("button", { name: "Upload file" }));
  expect(clickSpy).toHaveBeenCalledOnce();
  screen.getByRole("button", { name: "Upload file" }).focus();
  await userEvent.setup().keyboard(" ");
  expect(clickSpy).toHaveBeenCalledTimes(2);
  const changeSpy = vi.fn();
  rerender(
    <FileDropzone
      description="Choose a file"
      files={[{ name: "plain.txt", size: "2 KB" }]}
      label="Upload file"
      maximumSize="10 MB"
      onFilesSelected={changeSpy}
    />,
  );
  const emptyInput = container.querySelector("input[type=file]");
  if (emptyInput) fireEvent.change(emptyInput, { target: { files: null } });
  expect(screen.getByText("plain.txt")).toBeVisible();
  fireEvent.dragEnter(screen.getByRole("group", { name: "Upload file" }));
  fireEvent.drop(screen.getByRole("group", { name: "Upload file" }), {
    dataTransfer: { files: [file] },
  });
  expect(changeSpy).toHaveBeenCalled();
  rerender(
    <FileDropzone
      description="Choose a file"
      disabled
      files={[]}
      label="Upload file"
      maximumSize="10 MB"
      onFilesSelected={changeSpy}
    />,
  );
  fireEvent.drop(screen.getByRole("group", { name: "Upload file" }), {
    dataTransfer: { files: [file] },
  });
  expect(changeSpy).toHaveBeenCalledOnce();
});
