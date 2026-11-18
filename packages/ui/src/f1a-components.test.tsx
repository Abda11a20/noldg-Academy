import { axe } from "jest-axe";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Alert } from "./components/feedback/Alert";
import { Badge } from "./components/feedback/Badge";
import { EmptyState } from "./components/feedback/EmptyState";
import { ErrorState } from "./components/feedback/ErrorState";
import { ProgressBar } from "./components/feedback/ProgressBar";
import { Skeleton } from "./components/feedback/Skeleton";
import { Button } from "./components/button/Button";
import { ButtonGroup } from "./components/button/ButtonGroup";
import { ButtonContent } from "./components/button/ButtonContent";
import { Checkbox } from "./components/forms/Checkbox";
import { FileDropzone } from "./components/forms/FileDropzone";
import { PasswordField } from "./components/forms/PasswordField";
import { RadioGroup } from "./components/forms/RadioGroup";
import { SearchField } from "./components/forms/SearchField";
import { Select } from "./components/forms/Select";
import { Switch } from "./components/forms/Switch";
import { Textarea } from "./components/forms/Textarea";
import { TextField } from "./components/forms/TextField";
import { Avatar } from "./components/data-display/Avatar";
import { Card } from "./components/data-display/Card";
import { CardBody } from "./components/data-display/CardBody";
import { CardFooter } from "./components/data-display/CardFooter";
import { CardHeader } from "./components/data-display/CardHeader";
import { DataTable } from "./components/data-display/DataTable";
import { DescriptionList } from "./components/data-display/DescriptionList";
import { Stars } from "./components/data-display/Stars";
import { StatCard } from "./components/data-display/StatCard";
import { Icon } from "./components/icon/Icon";
import { Image } from "./components/image/Image";
import { UiProvider } from "./providers/UiProvider";
import type { UiLinkProps } from "./providers/UiProvider";
import { Container } from "./components/layout/Container";
import { Divider } from "./components/layout/Divider";
import { Grid } from "./components/layout/Grid";
import { Inline } from "./components/layout/Inline";
import { Stack } from "./components/layout/Stack";
import { Heading } from "./components/typography/Heading";
import { Link } from "./components/typography/Link";
import { Text } from "./components/typography/Text";

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

describe("F1A shared UI components", () => {
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

  it("wires field labels, descriptions, errors, password toggle, search, and character count", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <TextField error="Required" hint="Use your profile name" id="name" label="Name" />
        <TextField id="required-name" label="Required name" required />
        <PasswordField
          id="password"
          label="Password"
          showLabel="Show password"
          hideLabel="Hide password"
          hint="Use a secure phrase"
          error="Too short"
          required
        />
        <PasswordField
          id="plain-password"
          label="Plain password"
          showLabel="Show password"
          hideLabel="Hide password"
        />
        <SearchField label="Search courses" />
        <Textarea
          defaultValue="hello"
          error="Invalid"
          hint="Keep it brief"
          id="message"
          label="Message"
          maxLength={20}
          showCharacterCount
        />
        <Textarea
          id="controlled-message"
          label="Controlled message"
          onChange={() => undefined}
          showCharacterCount
          value="text"
        />
        <Textarea id="empty-message" label="Empty message" />
      </>,
    );
    expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Name")).toHaveAttribute(
      "aria-describedby",
      "name-hint name-error",
    );
    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getAllByRole("button", { name: "Show password" })[0]!);
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
    expect(screen.getByText("5 / 20")).toBeVisible();
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("supports Radix select, checkbox, radio, and switch keyboard and controlled states", async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    const { container, unmount } = render(
      <>
        <Select
          id="subject"
          label="Subject"
          options={[
            { value: "math", label: "Math" },
            { value: "science", label: "Science", disabled: true },
          ]}
          placeholder="Choose"
          onValueChange={changed}
        />
        <Checkbox id="terms" label="Agree" />
        <RadioGroup
          id="mode"
          label="Mode"
          options={[
            { value: "online", label: "Online" },
            { value: "room", label: "In person" },
          ]}
          defaultValue="online"
        />
        <Switch id="notice" label="Notifications" />
      </>,
    );
    await user.click(screen.getByRole("combobox", { name: "Subject" }));
    await user.keyboard("{ArrowDown}{Enter}");
    expect(changed).toHaveBeenCalledWith("math");
    await user.click(screen.getByRole("checkbox", { name: "Agree" }));
    expect(screen.getByRole("checkbox", { name: "Agree" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "In person" }));
    expect(screen.getByRole("radio", { name: "In person" })).toBeChecked();
    await user.click(screen.getByRole("switch", { name: "Notifications" }));
    expect(screen.getByRole("switch", { name: "Notifications" })).toHaveAttribute(
      "data-state",
      "checked",
    );
    expect((await axe(container)).violations).toHaveLength(0);
    unmount();
    const controlled = render(
      <>
        <Select
          disabled
          error="Invalid"
          hint="Choose one"
          id="disabled-subject"
          label="Subject"
          options={[]}
          placeholder="Choose"
          value=""
        />
        <RadioGroup
          disabled
          id="disabled-mode"
          label="Mode"
          options={[]}
          orientation="horizontal"
        />
        <Checkbox checked id="controlled-terms" label="Controlled" onCheckedChange={changed} />
        <Switch
          checked
          id="controlled-notice"
          label="Controlled notifications"
          onCheckedChange={changed}
        />
      </>,
    );
    await user.click(screen.getByRole("checkbox", { name: "Controlled" }));
    expect(changed).toHaveBeenCalledWith(false);
    await user.click(screen.getByRole("switch", { name: "Controlled notifications" }));
    expect(changed).toHaveBeenCalledWith(false);
    expect((await axe(controlled.container)).violations).toHaveLength(0);
  });

  it("emits selected drop files and displays supplied progress and errors", async () => {
    const onFilesSelected = vi.fn();
    const { container, rerender } = render(
      <FileDropzone
        accept="image/*"
        description="Choose a file"
        files={[{ name: "photo.png", size: "1 MB", progress: 40, error: "Too large" }]}
        label="Upload file"
        maximumSize="10 MB"
        onFilesSelected={onFilesSelected}
      />,
    );
    const input = container.querySelector("input[type=file]");
    expect(input).toHaveAttribute("accept", "image/*");
    expect(screen.getByText("Too large")).toBeVisible();
    expect(screen.getByRole("progressbar", { name: "photo.png" })).toHaveAttribute("value", "40");
    const file = new File(["content"], "photo.png", { type: "image/png" });
    fireEvent.change(input as HTMLInputElement, { target: { files: [file] } });
    expect(onFilesSelected).toHaveBeenCalled();
    expect((await axe(container)).violations).toHaveLength(0);
    rerender(
      <FileDropzone
        description="Choose a file"
        files={[]}
        label="Upload file"
        maximumSize="10 MB"
      />,
    );
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    fireEvent.dragEnter(screen.getByRole("group", { name: "Upload file" }));
    fireEvent.dragOver(screen.getByRole("group", { name: "Upload file" }));
    expect(screen.getByRole("group", { name: "Upload file" })).toHaveClass("border-primary");
    fireEvent.dragLeave(screen.getByRole("group", { name: "Upload file" }));
    const clickSpy = vi
      .spyOn(HTMLInputElement.prototype, "click")
      .mockImplementation(() => undefined);
    fireEvent.click(screen.getByRole("button", { name: "Upload file" }));
    expect(clickSpy).toHaveBeenCalledOnce();
    const changeSpy = vi.fn();
    rerender(
      <FileDropzone
        description="Choose a file"
        files={[{ name: "plain.txt", size: "2 KB" }]}
        label="Upload file"
        maximumSize="10 MB"
        onFilesSelected={changeSpy}
      />,
    );
    const emptyInput = container.querySelector("input[type=file]");
    if (emptyInput) fireEvent.change(emptyInput, { target: { files: null } });
    expect(screen.getByText("plain.txt")).toBeVisible();
    fireEvent.dragEnter(screen.getByRole("group", { name: "Upload file" }));
    fireEvent.drop(screen.getByRole("group", { name: "Upload file" }), {
      dataTransfer: { files: [file] },
    });
    expect(changeSpy).toHaveBeenCalled();
    rerender(
      <FileDropzone
        description="Choose a file"
        disabled
        files={[]}
        label="Upload file"
        maximumSize="10 MB"
        onFilesSelected={changeSpy}
      />,
    );
    fireEvent.drop(screen.getByRole("group", { name: "Upload file" }), {
      dataTransfer: { files: [file] },
    });
    expect(changeSpy).toHaveBeenCalledOnce();
  });

  it("renders accessible feedback components, semantic tones, and progress edge values", async () => {
    const { container, rerender } = render(
      <>
        <Alert tone="info" title="Saved">
          Ready
        </Alert>
        <Alert tone="danger">Failed</Alert>
        <Badge tone="success">Active</Badge>
        <Skeleton height="lg" />
        <ProgressBar label="Course progress" value={150} />
        <EmptyState description="No courses" icon="book" title="Empty" />
        <ErrorState action={<Button>Help</Button>} description="Try later" title="Failed" />
        <ErrorState
          description="Try later"
          onRetry={() => undefined}
          retryLabel="Retry"
          title="Failed"
        />
      </>,
    );
    expect(screen.getByRole("progressbar", { name: "Course progress" })).toHaveAttribute(
      "value",
      "100",
    );
    expect(screen.getByText("Saved").closest("[role=status]")).toHaveTextContent("Saved");
    expect((await axe(container)).violations).toHaveLength(0);
    rerender(<ProgressBar label="Loading" />);
    expect(screen.getByRole("progressbar", { name: "Loading" })).not.toHaveAttribute("value");
  });

  it("renders display components and every DataTable state with responsive labels", async () => {
    interface Row {
      id: string;
      name: string;
    }
    const columns = [
      { id: "name", header: "Name", sort: "ascending" as const, render: (row: Row) => row.name },
      { id: "id", header: "ID", render: (row: Row) => row.id },
    ];
    const states = render(
      <>
        <Card aria-label="Summary">
          <CardHeader>Header</CardHeader>
          <CardBody>Card content</CardBody>
          <CardFooter>Footer</CardFooter>
        </Card>
        <StatCard icon={<Icon name="star" />} label="Lessons" value="24" trend="Up" />
        <StatCard label="Loading" value="" loading />
        <Avatar initials="MA" label="Mona" />
        <Avatar asset="wordmark" initials="MA" label="Mona profile" />
        <Image alt="Registered wordmark" asset="wordmark" fixedAspect />
        <Stars label="Rating" value={3.5} />
        <DescriptionList items={[{ term: "Student", description: "Mona" }]} />
        <DescriptionList columns={2} items={[{ term: "Student", description: "Mona" }]} />
        <Container size="sm">
          <Stack>
            <Inline>
              <Text>Inline text</Text>
            </Inline>
            <Heading level={1}>Heading</Heading>
            <Grid columns={3}>
              <Text>Grid cell</Text>
            </Grid>
            <Divider />
            <Divider orientation="vertical" />
          </Stack>
        </Container>
        <DataTable
          columns={columns}
          emptyContent={<span>No data</span>}
          getRowKey={(row) => row.id}
          label="Students"
          loadingContent={<span>Loading</span>}
          rows={[{ id: "a", name: "Mona" }]}
        />
      </>,
    );
    expect(screen.getByRole("table", { name: "Students" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Rating" })).toBeInTheDocument();
    states.rerender(
      <DataTable
        columns={columns}
        emptyContent={<span>No data</span>}
        getRowKey={(row) => row.id}
        label="Students"
        loading
        loadingContent={<span>Loading</span>}
        rows={[]}
      />,
    );
    expect(screen.getByText("Loading")).toBeVisible();
    states.rerender(
      <DataTable
        columns={columns}
        emptyContent={<span>No data</span>}
        getRowKey={(row) => row.id}
        label="Students"
        loadingContent={<span>Loading</span>}
        rows={[]}
      />,
    );
    expect(screen.getByText("No data")).toBeVisible();
    states.rerender(
      <DataTable
        columns={columns}
        emptyContent={<span>No data</span>}
        errorContent={<span>Failed</span>}
        getRowKey={(row) => row.id}
        label="Students"
        loadingContent={<span>Loading</span>}
        rows={[]}
      />,
    );
    expect(screen.getByText("Failed")).toBeVisible();
    const user = userEvent.setup();
    const onChange = vi.fn();
    states.rerender(
      <Stars
        getOptionLabel={(value) => `${value} stars`}
        label="Rate"
        onChange={onChange}
        value={2}
      />,
    );
    await user.click(screen.getByRole("button", { name: "4 stars" }));
    expect(onChange).toHaveBeenCalledWith(4);
    const keyboardRating = screen.getByRole("button", { name: "3 stars" });
    keyboardRating.focus();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith(3);
  });
});
