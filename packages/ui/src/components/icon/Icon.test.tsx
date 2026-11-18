import { axe } from "jest-axe";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getIconDirectionBehavior, type IconName } from "../../icons";
import { Icon } from "./Icon";

describe("Icon", () => {
  it("renders a labelled icon accessibly", async () => {
    const { container } = render(<Icon label="Search" name="search" />);
    expect(screen.getByRole("img", { name: "Search" })).toBeInTheDocument();
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("flips directional icons only in right-to-left direction", () => {
    const { rerender, container } = render(<Icon direction="rtl" name="chevronStart" />);
    expect(container.querySelector(".icon-flipped")).toBeInTheDocument();
    expect(getIconDirectionBehavior("chevronStart", "rtl")).toBe("flip");
    rerender(<Icon direction="ltr" name="chevronStart" />);
    expect(container.querySelector(".icon-flipped")).not.toBeInTheDocument();
    expect(getIconDirectionBehavior("chevronEnd", "ltr")).toBe("none");
    expect(getIconDirectionBehavior("unknown" as IconName, "rtl")).toBe("none");
  });

  it("marks inherited directional icons for automatic RTL styling", () => {
    const { container } = render(<Icon name="chevronEnd" />);
    expect(container.querySelector(".icon-direction-auto")).toBeInTheDocument();
    expect(getIconDirectionBehavior("chevronEnd", "auto")).toBe("auto");
  });
});
