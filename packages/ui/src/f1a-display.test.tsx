import { axe } from "jest-axe";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Button } from "./components/button/Button";
import { Alert } from "./components/feedback/Alert";
import { Badge } from "./components/feedback/Badge";
import { EmptyState } from "./components/feedback/EmptyState";
import { ErrorState } from "./components/feedback/ErrorState";
import { ProgressBar } from "./components/feedback/ProgressBar";
import { Skeleton } from "./components/feedback/Skeleton";
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
import { Container } from "./components/layout/Container";
import { Divider } from "./components/layout/Divider";
import { Grid } from "./components/layout/Grid";
import { Inline } from "./components/layout/Inline";
import { Stack } from "./components/layout/Stack";
import { Heading } from "./components/typography/Heading";
import { Text } from "./components/typography/Text";
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
  expect((await axe(states.container)).violations).toHaveLength(0);
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
  expect((await axe(states.container)).violations).toHaveLength(0);
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
  expect((await axe(states.container)).violations).toHaveLength(0);
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
  expect((await axe(states.container)).violations).toHaveLength(0);
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
  expect((await axe(states.container)).violations).toHaveLength(0);
  await user.click(screen.getByRole("button", { name: "4 stars" }));
  expect(onChange).toHaveBeenCalledWith(4);
  const keyboardRating = screen.getByRole("button", { name: "3 stars" });
  keyboardRating.focus();
  await user.keyboard("{Enter}");
  expect(onChange).toHaveBeenCalledWith(3);
});
