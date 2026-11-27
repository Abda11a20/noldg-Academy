import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { renderPage } from "../../../shared/testing/render-page";
import i18n from "../../../shared/i18n";
import { AdminOrderFilters } from "./AdminOrderFilters";

beforeEach(async () => i18n.changeLanguage("en"));
afterEach(cleanup);

it("updates text, Cairo date filters, and expiring flag without retaining empty values", async () => {
  const onChange = vi.fn();
  renderPage(
    <AdminOrderFilters
      filters={{
        teacherId: "teacher-old",
        expiringSoon: "true",
        from: "2026-12-01T09:00:00.000Z",
      }}
      onChange={onChange}
    />,
  );

  fireEvent.change(screen.getByRole("textbox", { name: "Teacher ID" }), {
    target: { value: "teacher-new" },
  });
  expect(onChange).toHaveBeenLastCalledWith({
    teacherId: "teacher-new",
    expiringSoon: "true",
    from: "2026-12-01T09:00:00.000Z",
  });

  fireEvent.change(screen.getByLabelText("Created from (Cairo time)"), {
    target: { value: "2026-12-02T11:00" },
  });
  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ from: expect.any(String) }));

  fireEvent.change(screen.getByLabelText("Created to (Cairo time)"), {
    target: { value: "" },
  });
  expect(onChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ teacherId: "teacher-old", expiringSoon: "true" }),
  );
  expect(onChange.mock.lastCall?.[0]).not.toHaveProperty("to");

  fireEvent.click(screen.getByRole("switch", { name: "Expiring soon" }));
  expect(onChange.mock.lastCall?.[0]).not.toHaveProperty("expiringSoon");
});
