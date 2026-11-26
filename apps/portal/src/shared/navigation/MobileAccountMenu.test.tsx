import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import i18n from "../i18n";
import { renderPage } from "../testing/render-page";
import { MobileAccountMenu } from "./MobileAccountMenu";

beforeEach(async () => i18n.changeLanguage("en"));
afterEach(cleanup);

it("offers the alternate language and logout action in the account menu", async () => {
  const user = userEvent.setup();
  const onLogout = vi.fn();
  renderPage(<MobileAccountMenu logoutLabel="Log out" onLogout={onLogout} />);
  await user.click(screen.getByRole("button", { name: "Account menu" }));
  await user.click(await screen.findByRole("menuitem", { name: "العربية" }));
  expect(i18n.resolvedLanguage).toBe("ar");
  await user.click(screen.getByRole("button", { name: "قائمة الحساب" }));
  await user.click(await screen.findByRole("menuitem", { name: "Log out" }));
  expect(onLogout).toHaveBeenCalledOnce();
});

it("offers the language action when logout is unavailable", async () => {
  const user = userEvent.setup();
  renderPage(<MobileAccountMenu />);
  await user.click(screen.getByRole("button", { name: "Account menu" }));
  expect(await screen.findByRole("menuitem", { name: "العربية" })).not.toBeNull();
});
