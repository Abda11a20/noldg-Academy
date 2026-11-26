import { axe } from "jest-axe";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { MobileNav } from "./navigation/MobileNav";
import { Pagination } from "./navigation/Pagination";
import { UiProvider, type UiLinkProps } from "../providers/UiProvider";

function TestLink({ to, children }: UiLinkProps) {
  return <a href={to}>{children}</a>;
}

it("opens and closes the responsive navigation drawer", async () => {
  const user = userEvent.setup();
  const { container } = render(
    <UiProvider direction="ltr" linkComponent={TestLink}>
      <MobileNav
        items={[{ to: "/", label: "Home", icon: "home" }]}
        label="Navigation"
        openLabel="Open navigation"
        closeLabel="Close navigation"
      />
    </UiProvider>,
  );
  expect((await axe(container)).violations).toHaveLength(0);
  await user.click(screen.getByRole("button", { name: "Open navigation" }));
  expect(await screen.findByRole("dialog", { name: "Navigation" })).toBeInTheDocument();
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

it("paginates safely and calls the configured size and page events", async () => {
  const onPageChange = vi.fn();
  const onPageSizeChange = vi.fn();
  const user = userEvent.setup();
  render(
    <Pagination
      page={2}
      pageSize={10}
      total={30}
      pageLabel="Pagination"
      pageSizeLabel="Rows per page"
      pageSizePlaceholder="Choose"
      previousLabel="Previous"
      nextLabel="Next"
      pageSizeOptions={[10, 20]}
      pageStatus={(page, count) => `${page} of ${count}`}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Previous" }));
  expect(onPageChange).toHaveBeenCalledWith(1);
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(onPageChange).toHaveBeenCalledWith(3);
  await user.click(screen.getByRole("combobox", { name: "Rows per page" }));
  await user.click(await screen.findByRole("option", { name: "20" }));
  expect(onPageSizeChange).toHaveBeenCalledWith(20);
});
