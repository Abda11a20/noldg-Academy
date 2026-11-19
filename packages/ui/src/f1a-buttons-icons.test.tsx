import { axe } from "jest-axe";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Button } from "./components/button/Button";
import { ButtonContent } from "./components/button/ButtonContent";
import { ButtonGroup } from "./components/button/ButtonGroup";
import { Icon } from "./components/icon/Icon";
import { Link } from "./components/typography/Link";
import { UiProvider, type UiLinkProps } from "./providers/UiProvider";

function TestRouterLink({ to, children, onClick, ...props }: UiLinkProps) {
  return (
    <a
      href={to}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        event.preventDefault();
      }}
    >
      {children}
    </a>
  );
}
it("renders every button variant and size with loading and icon-only rules", async () => {
  const user = userEvent.setup();
  const onClick = vi.fn();
  const { rerender } = render(<Button onClick={onClick}>Continue</Button>);
  expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  rerender(<Button disabled>Continue</Button>);
  expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  rerender(
    <Button loading onClick={onClick}>
      Continue
    </Button>,
  );
  expect(screen.getByRole("button", { name: "Continue" })).toHaveAttribute("aria-busy", "true");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  expect(onClick).not.toHaveBeenCalled();
  rerender(<Button aria-label="Search" iconOnly iconStart="search" />);
  expect(screen.getByRole("button", { name: "Search" })).toBeVisible();
  expect(() => render(<Button iconOnly iconStart="search" />)).toThrow(/accessible aria-label/);
  expect(
    render(
      <ButtonGroup>
        <Button>One</Button>
        <Button variant="secondary">Two</Button>
      </ButtonGroup>,
    ).container,
  ).toBeInTheDocument();
  expect(
    render(
      <Button iconStart="search" iconEnd="chevronEnd">
        Continue
      </Button>,
    ).container,
  ).toBeInTheDocument();
  expect(
    render(
      <ButtonContent loading iconStart="search" iconEnd="close">
        Continue
      </ButtonContent>,
    ).container,
  ).toBeInTheDocument();
});

it("renders accessible icon labels and flips directional icons in RTL", async () => {
  const { container } = render(
    <UiProvider direction="rtl">
      <Icon name="arrowStart" label="Back" />
    </UiProvider>,
  );
  expect(screen.getByRole("img", { name: "Back" })).toHaveClass("icon-flipped");
  expect((await axe(container)).violations).toHaveLength(0);
});

it("uses the injected router link and blocks unavailable navigation", async () => {
  const user = userEvent.setup();
  const onClick = vi.fn();
  const { rerender } = render(
    <UiProvider direction="ltr" linkComponent={TestRouterLink}>
      <UiProvider direction="rtl">
        <Button to="/student" onClick={onClick}>
          Open
        </Button>
      </UiProvider>
    </UiProvider>,
  );
  const link = screen.getByRole("link", { name: "Open" });
  expect(link).toHaveAttribute("href", "/student");
  await user.click(link);
  expect(onClick).toHaveBeenCalledOnce();
  rerender(
    <UiProvider direction="ltr" linkComponent={TestRouterLink}>
      <UiProvider direction="rtl">
        <Button disabled to="/student" onClick={onClick}>
          Open
        </Button>
      </UiProvider>
    </UiProvider>,
  );
  await user.click(screen.getByRole("link", { name: "Open" }));
  expect(onClick).toHaveBeenCalledOnce();
  rerender(
    <UiProvider direction="ltr" linkComponent={TestRouterLink}>
      <Button loading to="/student" onClick={onClick}>
        Open
      </Button>
    </UiProvider>,
  );
  expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute("aria-disabled", "true");
  rerender(
    <UiProvider direction="ltr" linkComponent={TestRouterLink}>
      <Link to="/home">Home</Link>
    </UiProvider>,
  );
  expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/home");
  expect(() => render(<Link to="/home">Home</Link>)).toThrow(/UiProvider router link/);
  expect(() => render(<Button to="/student">Open</Button>)).toThrow(/UiProvider link component/);
});
