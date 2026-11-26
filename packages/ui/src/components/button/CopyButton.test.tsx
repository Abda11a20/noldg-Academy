import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "jest-axe";
import { CopyButton } from "./CopyButton";

describe("CopyButton", () => {
  it("emits the value and announces the copied state", () => {
    const onCopy = vi.fn();
    render(<CopyButton value="ORD-1" label="Copy" copiedLabel="Copied" copied onCopy={onCopy} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(onCopy).toHaveBeenCalledWith("ORD-1");
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
  });

  it("has no accessibility violations before copying", async () => {
    const { container } = render(
      <CopyButton
        value="ORD-1"
        label="Copy"
        copiedLabel="Copied"
        copied={false}
        onCopy={vi.fn()}
      />,
    );
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
