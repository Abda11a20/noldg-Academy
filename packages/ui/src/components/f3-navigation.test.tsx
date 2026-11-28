import { axe } from "jest-axe";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { AppShell } from "./layout/AppShell";
import { DataTable } from "./data-display/DataTable";
import { Avatar } from "./data-display/Avatar";
import { Chip } from "./data-display/Chip";
import { Breadcrumbs } from "./navigation/Breadcrumbs";
import { NavItem } from "./navigation/NavItem";
import { Sidebar } from "./navigation/Sidebar";
import { Topbar } from "./navigation/Topbar";
import { UiProvider, type UiLinkProps } from "../providers/UiProvider";

function TestLink({ to, children, ...props }: UiLinkProps) {
  return (
    <a href={to} {...props}>
      {children}
    </a>
  );
}

it("renders the app shell, breadcrumb trail and shared navigation accessibly", async () => {
  const items = [
    { to: "/home", label: "Home", icon: "home" as const, active: true },
    { to: "/settings", label: "Settings", icon: "settings" as const, badge: "2" },
  ];
  const { container } = render(
    <UiProvider direction="ltr" linkComponent={TestLink}>
      <AppShell
        topbar={
          <Topbar
            logoAlt="Academy"
            userName="A User"
            roleLabel="Admin"
            logoutLabel="Log out"
            onLogout={() => undefined}
          />
        }
        sidebar={<Sidebar items={items} label="Main navigation" />}
        mobileNavigation={<nav aria-label="Mobile navigation" />}
      >
        <Breadcrumbs
          label="Breadcrumbs"
          items={[{ label: "Home", to: "/home" }, { label: "Current" }]}
        />
        <NavItem to="/settings" label="Settings" icon="settings" badge="2" />
        <Avatar label="Account avatar" initials="AA" />
        <Chip>Math</Chip>
      </AppShell>
    </UiProvider>,
  );
  expect((await axe(container)).violations).toHaveLength(0);
  expect(screen.getByRole("navigation", { name: "Breadcrumbs" })).toBeInTheDocument();
  const mainNav = screen.getByRole("navigation", { name: "Main navigation" });
  expect(mainNav).toBeInTheDocument();
  expect(within(mainNav).getByRole("link", { name: "Home" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(screen.getByRole("img", { name: "Account avatar" })).toBeInTheDocument();
});

it("omits the desktop sidebar landmark when sidebar is null", () => {
  const { container } = render(
    <AppShell topbar={<header />} sidebar={null} mobileNavigation={null}>
      <p>Auth screen</p>
    </AppShell>,
  );
  expect(container.querySelector("aside")).toBeNull();
  expect(screen.getByText("Auth screen")).toBeInTheDocument();
});

it("renders a sortable data table and forwards the requested sort column", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn();
  const { container } = render(
    <DataTable
      label="People"
      actionColumnLabel="Actions"
      columns={[
        { id: "name", header: "Name", render: (row: { name: string }) => row.name, sort: "none" },
      ]}
      rows={[{ name: "A User" }]}
      getRowKey={(row) => row.name}
      loadingContent={<p>Loading</p>}
      emptyContent={<p>Empty</p>}
      onSort={onSort}
      sortLabel={(name) => `Sort by ${name}`}
      rowActions={() => <button>Action</button>}
    />,
  );
  expect((await axe(container)).violations).toHaveLength(0);
  await user.click(screen.getByRole("button", { name: "Sort by Name" }));
  expect(onSort).toHaveBeenCalledWith("name");
});

it("labels the action column from the table when an explicit label is absent", () => {
  render(
    <DataTable
      label="People"
      columns={[{ id: "name", header: "Name", render: (row: { name: string }) => row.name }]}
      rows={[{ name: "A User" }]}
      getRowKey={(row) => row.name}
      loadingContent={<p>Loading</p>}
      emptyContent={<p>Empty</p>}
      rowActions={() => <button>Action</button>}
    />,
  );
  expect(screen.getByRole("columnheader", { name: "People" })).toBeInTheDocument();
});

it("renders a registered image avatar and an icon-free chip", () => {
  render(
    <>
      <Avatar label="Academy avatar" initials="NA" asset="wordmark" />
      <Chip>Mathematics</Chip>
    </>,
  );
  expect(screen.getByRole("img", { name: "Academy avatar" })).toBeInTheDocument();
  expect(screen.getByText("Mathematics")).toBeInTheDocument();
});

it("renders a secure remote avatar and intermediate breadcrumb labels as text", () => {
  render(
    <UiProvider direction="ltr" linkComponent={TestLink}>
      <Breadcrumbs
        label="Breadcrumbs"
        items={[{ label: "Home", to: "/home" }, { label: "Section" }, { label: "Current" }]}
      />
      <Avatar label="Remote avatar" initials="RA" remoteSrc="https://cdn.example.test/avatar.png" />
    </UiProvider>,
  );
  expect(screen.getByText("Section")).not.toHaveAttribute("aria-current");
  expect(screen.getByRole("img", { name: "Remote avatar" })).toBeInTheDocument();
});
