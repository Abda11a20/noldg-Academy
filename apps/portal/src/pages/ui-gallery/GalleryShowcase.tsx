import { useTranslation } from "react-i18next";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Checkbox,
  Container,
  DataTable,
  DescriptionList,
  Divider,
  EmptyState,
  ErrorState,
  FileDropzone,
  Grid,
  Heading,
  Inline,
  PasswordField,
  ProgressBar,
  RadioGroup,
  SearchField,
  Select,
  Skeleton,
  Stack,
  StatCard,
  Stars,
  Switch,
  Text,
  Textarea,
  TextField,
} from "@noldg/ui";

interface StudentRow {
  name: string;
  grade: string;
}
export interface GalleryShowcaseProps {
  direction: "rtl" | "ltr";
}

/** Displays the F1A shared components with translated examples and interaction states. */
export function GalleryShowcase({ direction }: GalleryShowcaseProps) {
  const { t } = useTranslation("common");
  const prefix = direction === "rtl" ? "rtl" : "ltr";
  const options = [
    { value: "math", label: t("sampleOptionMath") },
    { value: "science", label: t("sampleOptionScience") },
  ];
  const columns = [
    { id: "name", header: t("sampleTableName"), render: (row: StudentRow) => row.name },
    {
      id: "grade",
      header: t("sampleTableGrade"),
      render: (row: StudentRow) => row.grade,
      sort: "ascending" as const,
    },
  ];
  const rows = [{ name: t("sampleTableValue"), grade: "١٢" }];

  return (
    <Container
      className="space-y-8 rounded-lg border border-border bg-background p-4 sm:p-6"
      size="full"
    >
      <section aria-label={t("galleryForms")}>
        <Heading level={3}>{t("galleryForms")}</Heading>
        <Grid className="mt-4" columns={2}>
          <TextField id={`${prefix}-name`} label={t("sampleName")} hint={t("sampleHint")} />
          <TextField
            id={`${prefix}-name-error`}
            label={t("sampleName")}
            error={t("sampleError")}
            required
          />
          <TextField disabled id={`${prefix}-name-disabled`} label={t("sampleName")} />
          <PasswordField
            id={`${prefix}-password`}
            label={t("samplePassword")}
            showLabel={t("showPassword")}
            hideLabel={t("hidePassword")}
          />
          <SearchField label={t("sampleSearch")} />
          <Textarea
            id={`${prefix}-message`}
            label={t("sampleMessage")}
            maxLength={100}
            showCharacterCount
            defaultValue={t("sampleAlertBody")}
          />
          <Select
            id={`${prefix}-select`}
            label={t("sampleSelect")}
            options={options}
            placeholder={t("sampleSelect")}
            defaultValue="math"
          />
          <Stack>
            <Checkbox id={`${prefix}-checkbox`} label={t("sampleCheck")} defaultChecked />
            <RadioGroup
              id={`${prefix}-radio`}
              label={t("sampleRadio")}
              options={[
                { value: "online", label: t("sampleOnline") },
                { value: "person", label: t("sampleInPerson") },
              ]}
              defaultValue="online"
            />
            <Switch id={`${prefix}-switch`} label={t("sampleSwitch")} defaultChecked />
          </Stack>
          <FileDropzone
            accept="image/*,.pdf"
            description={t("sampleDropDescription")}
            files={[]}
            label={t("sampleDropzone")}
            maximumSize={t("sampleFileSize")}
          />
        </Grid>
      </section>

      <section aria-label={t("galleryFeedback")}>
        <Heading level={3}>{t("galleryFeedback")}</Heading>
        <Stack className="mt-4">
          <Inline>
            {(["info", "success", "warning", "danger"] as const).map((tone) => (
              <Alert key={tone} tone={tone} title={t("sampleAlertTitle")}>
                {t("sampleAlertBody")}
              </Alert>
            ))}
          </Inline>
          <Inline>
            {(["neutral", "primary", "success", "warning", "danger", "info"] as const).map(
              (tone) => (
                <Badge key={tone} tone={tone}>
                  {t("sampleBadge")}
                </Badge>
              ),
            )}
          </Inline>
          <Inline>
            <Skeleton height="sm" width="third" />
            <Skeleton height="md" width="half" />
            <Skeleton height="lg" />
          </Inline>
          <ProgressBar label={t("sampleProgress")} value={64} />
          <ProgressBar label={t("sampleLoading")} />
          <EmptyState
            description={t("sampleEmptyBody")}
            icon="book"
            title={t("sampleEmptyTitle")}
            action={<Button>{t("sampleAction")}</Button>}
          />
          <ErrorState
            description={t("sampleError")}
            onRetry={() => undefined}
            retryLabel={t("sampleRetry")}
            title={t("sampleErrorTitle")}
          />
        </Stack>
      </section>

      <section aria-label={t("galleryData")}>
        <Heading level={3}>{t("galleryData")}</Heading>
        <Grid className="mt-4" columns={2}>
          <Card>
            <CardHeader>
              <Heading level={4} size="md">
                {t("sampleStudent")}
              </Heading>
            </CardHeader>
            <CardBody>
              <Text>{t("sampleName")}</Text>
            </CardBody>
            <CardFooter>
              <ButtonGroup>
                <Button size="sm">{t("sampleAction")}</Button>
                <Button size="sm" variant="secondary">
                  {t("goHome")}
                </Button>
              </ButtonGroup>
            </CardFooter>
          </Card>
          <StatCard
            icon={<Avatar initials="م" label={t("sampleAvatar")} />}
            label={t("sampleStatLabel")}
            value={t("sampleStatValue")}
            trend={t("sampleTrend")}
          />
          <StatCard label={t("sampleStatLabel")} loading value={t("sampleStatValue")} />
          <div className="flex flex-col gap-3">
            <Stars label={t("sampleRating")} value={3.5} />
            <Stars
              getOptionLabel={(value) => t("sampleRatingLabel", { value })}
              label={t("sampleRating")}
              onChange={() => undefined}
              value={3}
            />
          </div>
          <DescriptionList
            columns={2}
            items={[
              { term: t("sampleStudent"), description: t("sampleTableValue") },
              { term: t("sampleStatus"), description: t("sampleBadge") },
            ]}
          />
          <DataTable
            columns={columns}
            emptyContent={
              <EmptyState
                description={t("sampleEmptyBody")}
                icon="book"
                title={t("sampleEmptyTitle")}
              />
            }
            getRowKey={(row) => row.name}
            label={t("sampleTable")}
            loadingContent={<Skeleton />}
            rows={rows}
          />
          <DataTable
            columns={columns}
            emptyContent={
              <EmptyState
                description={t("sampleEmptyBody")}
                icon="book"
                title={t("sampleEmptyTitle")}
              />
            }
            getRowKey={(row) => row.name}
            label={t("sampleTable")}
            loadingContent={<Skeleton />}
            rows={[]}
          />
          <DataTable
            columns={columns}
            emptyContent={
              <EmptyState
                description={t("sampleEmptyBody")}
                icon="book"
                title={t("sampleEmptyTitle")}
              />
            }
            errorContent={
              <ErrorState description={t("sampleError")} title={t("sampleErrorTitle")} />
            }
            getRowKey={(row) => row.name}
            label={t("sampleTable")}
            loadingContent={<Skeleton />}
            rows={rows}
          />
        </Grid>
      </section>
      <Divider />
    </Container>
  );
}
