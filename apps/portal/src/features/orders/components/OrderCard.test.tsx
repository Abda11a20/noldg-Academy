import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { UiProvider, type UiLinkProps } from "@noldg/ui";
import { MemoryRouter, Link as RouterLink } from "react-router";
import type { OrderSummary } from "@noldg/api/contracts/orders";
import { OrderCard } from "./OrderCard";

function RouteLink(props: UiLinkProps) {
  return <RouterLink {...props} />;
}

const order: OrderSummary = {
  id: "order-test",
  orderNumber: "ORD-42",
  status: "awaiting_payment",
  priceSnapshot: { fullPrice: 600, amount: 400, announcedCount: 6, remainingCount: 4 },
  paymentMethod: "wallet",
  senderRef: "+201012345678",
  expiresAt: "2026-11-28T10:00:00.000Z",
  createdAt: "2026-11-26T10:00:00.000Z",
  serverNow: "2026-11-28T09:00:00.000Z",
  product: { id: "product-test", name: "Algebra", type: "package" },
  teacher: { id: "teacher-test", name: "Teacher" },
  payment: null,
};

it("shows the server amount, status, and display-only remaining time", () => {
  render(
    <MemoryRouter>
      <UiProvider direction="ltr" linkComponent={RouteLink}>
        <OrderCard
          order={order}
          href="/student/purchases/order-test"
          labels={{
            awaiting_payment: "Awaiting",
            completed: "Completed",
            rejected: "Rejected",
            expired: "Expired",
            cancelled: "Cancelled",
          }}
          remainingLabel="Time remaining"
          receivedAtMs={Date.now() - 1_800_000}
        />
      </UiProvider>
    </MemoryRouter>,
  );
  expect(screen.getByRole("link", { name: "ORD-42" }).getAttribute("href")).toBe(
    "/student/purchases/order-test",
  );
  expect(screen.getByText("Awaiting")).toBeTruthy();
  expect(screen.getByRole("time", { name: "Time remaining" }).textContent).toMatch(/^00:29:5\d$/);
});
