import { cleanup, screen } from "@testing-library/react";
import { OrderSummarySchema } from "@noldg/api/contracts/orders";
import { afterEach, beforeEach, expect, it } from "vitest";
import { renderPage } from "../../../shared/testing/render-page";
import i18n from "../../../shared/i18n";
import { OrderAdminMeta } from "./OrderAdminMeta";

beforeEach(async () => i18n.changeLanguage("en"));
afterEach(cleanup);

const LABELS = {
  student: (value: string) => `Student: ${value}`,
  teacher: (value: string) => `Teacher: ${value}`,
  sender: (value: string) => `Sender: ${value}`,
  methods: { instapay: "InstaPay", wallet: "Wallet", cash: "Cash" },
} as const;

const orderFixture = OrderSummarySchema.parse({
  id: "order-test",
  orderNumber: "ORD-TEST",
  status: "expired",
  priceSnapshot: { fullPrice: 100, amount: 100 },
  paymentMethod: "instapay",
  senderRef: "+201011112222",
  expiresAt: "2026-12-01T10:00:00.000Z",
  createdAt: "2026-11-25T10:00:00.000Z",
  product: { id: "product-test", name: "Test lesson", type: "lesson" },
  teacher: { id: "teacher-test", name: "Nour Hassan" },
  student: { id: "student-test", name: "منى علي", phone: "+201011112222" },
  payment: null,
});

it("shows available administrator payment details and safely omits absent fields", () => {
  renderPage(<OrderAdminMeta order={orderFixture} labels={LABELS} />);
  expect(screen.getByText("Student: منى علي")).toBeTruthy();
  expect(screen.getByText("Teacher: Nour Hassan")).toBeTruthy();
  expect(screen.getByText("InstaPay")).toBeTruthy();
  expect(screen.getByText("Sender: +201011112222")).toBeTruthy();
});

it("omits optional student and sender details when the snapshot has none", () => {
  const order = OrderSummarySchema.parse({ ...orderFixture, student: undefined, senderRef: null });
  renderPage(<OrderAdminMeta order={order} labels={LABELS} />);
  expect(screen.queryByText(/^Student:/u)).toBeNull();
  expect(screen.queryByText(/^Sender:/u)).toBeNull();
  expect(screen.getByText("Teacher: Nour Hassan")).toBeTruthy();
});
