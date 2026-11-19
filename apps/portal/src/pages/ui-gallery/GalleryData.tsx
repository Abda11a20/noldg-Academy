import { useTranslation } from "react-i18next";
import {
  Avatar,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  DataTable,
  DescriptionList,
  EmptyState,
  ErrorState,
  Grid,
  Heading,
  Skeleton,
  StatCard,
  Stars,
  Text,
} from "@noldg/ui";

interface StudentRow {
  name: string;
  grade: string;
}

/** Shows translated data-display components and table states. */
export function GalleryData() {
  const { t } = useTranslation("common");
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
  const emptyContent = (
    <EmptyState description={t("sampleEmptyBody")} icon="book" title={t("sampleEmptyTitle")} />
  );
  const loadingContent = <Skeleton />;

  return (
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
          emptyContent={emptyContent}
          getRowKey={(row) => row.name}
          label={t("sampleTable")}
          loadingContent={loadingContent}
          rows={rows}
        />
        <DataTable
          columns={columns}
          emptyContent={emptyContent}
          getRowKey={(row) => row.name}
          label={t("sampleTable")}
          loadingContent={loadingContent}
          rows={[]}
        />
        <DataTable
          columns={columns}
          emptyContent={emptyContent}
          errorContent={<ErrorState description={t("sampleError")} title={t("sampleErrorTitle")} />}
          getRowKey={(row) => row.name}
          label={t("sampleTable")}
          loadingContent={loadingContent}
          rows={rows}
        />
      </Grid>
    </section>
  );
}
