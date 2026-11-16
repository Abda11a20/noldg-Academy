import { axe } from "jest-axe";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders all variants and sizes", () => {
    const variants = ["primary", "secondary", "ghost", "danger"] as const;
    const sizes = ["sm", "md", "lg"] as const;
    for (const variant of variants) {
      for (const size of sizes) {
        const { unmount } = render(
          <Button size={size} variant={variant}>
            Continue
          </Button>,
        );
        expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
        unmount();
      }
    }
  });

  it("shows a busy disabled button while loading", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button loading onClick={onClick}>
        Continue
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Continue" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("has no axe violations", async () => {
    const { container } = render(<Button aria-label="Continue">Continue</Button>);
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
