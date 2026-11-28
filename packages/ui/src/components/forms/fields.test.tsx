import { axe } from "jest-axe";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DateTimeField } from "./DateTimeField";
import { MoneyField } from "./MoneyField";
import { FileRow } from "../data-display/FileRow";

describe("time and money fields", () => {
  it("renders native date-time bounds and associates the error", () => {
    render(
      <DateTimeField
        error="Choose a valid time"
        id="start"
        label="Start time"
        max="2024-12-31T23:59"
        min="2024-01-01T00:00"
        onChange={() => undefined}
        value="2024-06-01T12:30"
      />,
    );
    const input = screen.getByLabelText("Start time");
    expect(input).toHaveAttribute("type", "datetime-local");
    expect(input).toHaveAttribute("min", "2024-01-01T00:00");
    expect(input).toHaveAttribute("max", "2024-12-31T23:59");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("renders a day-level date input when mode is date", () => {
    render(
      <DateTimeField
        id="homework-start"
        label="Start day"
        mode="date"
        onChange={() => undefined}
        value="2026-12-01"
      />,
    );
    expect(screen.getByLabelText("Start day")).toHaveAttribute("type", "date");
    expect(screen.getByLabelText("Start day")).toHaveValue("2026-12-01");
  });

  it("renders an integer amount and supplied formatted value without calculating it", () => {
    render(
      <MoneyField
        formattedLabel="Current price"
        formattedValue="EGP 120"
        id="price"
        label="Price in EGP"
        error="Enter a valid amount"
        min={0}
        onChange={() => undefined}
        value={120}
      />,
    );
    expect(screen.getByLabelText("Price in EGP")).toHaveAttribute("step", "1");
    expect(screen.getByText("Current price: EGP 120")).toBeInTheDocument();
  });

  it("supports uncontrolled inputs without optional formatted copy", () => {
    render(
      <>
        <DateTimeField defaultValue="2026-01-01T10:00" id="uncontrolled-date" label="Date" />
        <MoneyField defaultValue="10" id="uncontrolled-money" label="Amount" />
      </>,
    );
    expect(screen.getByLabelText("Date")).toHaveValue("2026-01-01T10:00");
    expect(screen.getByLabelText("Amount")).toHaveValue(10);
  });

  it("handles absent field descriptions and server-formatted amounts", () => {
    render(
      <>
        <DateTimeField hint="Optional date" id="plain-date" label="Date" />
        <MoneyField
          hint="Optional amount"
          id="plain-money"
          label="Amount"
          formattedLabel="Current price"
        />
      </>,
    );
    expect(screen.getByLabelText("Date")).toHaveAttribute("aria-describedby", "plain-date-hint");
    expect(screen.getByLabelText("Amount")).toHaveAttribute("aria-describedby", "plain-money-hint");
    expect(screen.queryByText(/Current price:/)).not.toBeInTheDocument();
  });

  it("has no axe violations for either field", async () => {
    const { container } = render(
      <>
        <DateTimeField id="date" label="Date" />
        <MoneyField id="money" label="Amount" />
      </>,
    );
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("inherits RTL direction from its layout without changing native values", () => {
    render(
      <div dir="rtl">
        <DateTimeField id="rtl-date" label="Date" readOnly value="2026-06-01T10:00" />
        <MoneyField id="rtl-money" label="Amount" readOnly value={50} />
      </div>,
    );
    expect(screen.getByLabelText("Date").closest("[dir='rtl']")).not.toBeNull();
    expect(screen.getByLabelText("Amount")).toHaveValue(50);
  });
});

describe("FileRow", () => {
  it("shows status, progress, and supplied actions", async () => {
    const { container } = render(
      <FileRow
        name="lesson.mp4"
        onRemove={() => undefined}
        onRetry={() => undefined}
        progress={45}
        progressLabel="Upload progress"
        removeLabel="Remove"
        retryLabel="Retry"
        sizeLabel="12 MB"
        statusLabel="Uploading"
      />,
    );
    expect(screen.getByText("lesson.mp4")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Upload progress" })).toHaveAttribute(
      "value",
      "45",
    );
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("supports no actions or progress and disables supplied actions", () => {
    const { rerender } = render(
      <FileRow name="notes.pdf" progressLabel="Progress" sizeLabel="2 MB" statusLabel="Ready" />,
    );
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    rerender(
      <FileRow
        disabled
        name="notes.pdf"
        onRemove={() => undefined}
        progressLabel="Progress"
        removeLabel="Remove"
        sizeLabel="2 MB"
        statusLabel="Ready"
      />,
    );
    expect(screen.getByRole("button", { name: "Remove" })).toBeDisabled();
  });

  it("supports keyboard activation for retry and removal", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onRemove = vi.fn();
    render(
      <FileRow
        name="notes.pdf"
        onRemove={onRemove}
        onRetry={onRetry}
        progressLabel="Progress"
        removeLabel="Remove"
        retryLabel="Retry"
        sizeLabel="2 MB"
        statusLabel="Failed"
      />,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "Retry" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onRetry).toHaveBeenCalledOnce();
    await user.tab();
    await user.keyboard("{Enter}");
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("inherits right-to-left layout direction for file status and actions", () => {
    render(
      <div dir="rtl">
        <FileRow
          name="notes.pdf"
          progressLabel="Progress"
          removeLabel="Remove"
          onRemove={() => undefined}
          sizeLabel="2 MB"
          statusLabel="Ready"
        />
      </div>,
    );
    expect(screen.getByText("notes.pdf").closest("[dir='rtl']")).not.toBeNull();
  });
});
