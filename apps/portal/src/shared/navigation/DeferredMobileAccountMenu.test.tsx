import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it } from "vitest";
import i18n from "../i18n";
import { renderPage } from "../testing/render-page";
import { DeferredMobileAccountMenu } from "./DeferredMobileAccountMenu";

beforeEach(async () => i18n.changeLanguage("en"));
afterEach(cleanup);

it("loads and opens the account menu after its light trigger is activated", async () => {
  const user = userEvent.setup();
  renderPage(<DeferredMobileAccountMenu />);
  await user.click(screen.getByRole("button", { name: "Account menu" }));
  expect(await screen.findByRole("menuitem", { name: "العربية" })).not.toBeNull();
});
