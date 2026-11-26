import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "jest-axe";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("shows the supplied localized status label", async () => {
    const labels = {
      awaiting_payment: "Awaiting",
      completed: "Complete",
      rejected: "Rejected",
      expired: "Expired",
      cancelled: "Cancelled",
    } as const;
    const { rerender, container } = render(
      <StatusBadge status="awaiting_payment" labels={labels} />,
    );
    expect(screen.getByText("Awaiting")).toBeInTheDocument();
    for (const status of Object.keys(labels) as (keyof typeof labels)[])
      rerender(<StatusBadge status={status} labels={labels} />);
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
