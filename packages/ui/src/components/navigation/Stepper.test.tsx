import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "jest-axe";
import { Stepper } from "./Stepper";

describe("Stepper", () => {
  it("marks the current step and renders every supplied step", () => {
    render(
      <Stepper label="Checkout steps" steps={["Review", "Payment", "Confirm"]} currentStep={2} />,
    );
    expect(screen.getByRole("list", { name: "Checkout steps" })).toBeInTheDocument();
    expect(screen.getByText("Payment").closest("li")).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("Confirm")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Stepper label="Checkout steps" steps={["Review", "Payment"]} currentStep={1} />,
    );
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
