import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "jest-axe";
import { Countdown } from "./Countdown";

describe("Countdown", () => {
  it("formats remaining server-provided seconds without going below zero", () => {
    const { rerender } = render(<Countdown remainingSeconds={3661} label="Time left" />);
    expect(screen.getByRole("time", { name: "Time left" })).toHaveTextContent("01:01:01");
    rerender(<Countdown remainingSeconds={-1} label="Time left" />);
    expect(screen.getByRole("time", { name: "Time left" })).toHaveTextContent("00:00:00");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Countdown remainingSeconds={60} label="Time left" />);
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
