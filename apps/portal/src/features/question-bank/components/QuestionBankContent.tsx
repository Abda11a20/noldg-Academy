import { Alert, Button, Heading, Pagination } from "@noldg/ui";
import { capabilities } from "@noldg/api/config/capabilities";
import type { QuestionEntry } from "@noldg/api/contracts/assessments";
import { useListUrlState } from "../../../shared/navigation/useListUrlState";
import { QUESTION_PAGE_SIZE_OPTIONS } from "../constants";
import { QuestionBankDialogs } from "./QuestionBankDialogs";
import { QuestionFilters } from "./QuestionFilters";
import { QuestionList as QuestionListView } from "./QuestionList";
import type { QuestionBankLabels } from "../types";
import { useQuestions } from "../hooks/useQuestions";

export interface QuestionBankContentProps {
  list: ReturnType<typeof useListUrlState>;
  questions: ReturnType<typeof useQuestions>;
  data: { items: QuestionEntry[]; page: number; pageSize: number; total: number };
  labels: QuestionBankLabels;
}

/** Composes list controls, capability notices, results, pagination, and dialogs.
 * @param props URL-backed list controller, fetched data/mutations, and localized copy.
 */
export function QuestionBankContent({ list, questions, data, labels }: QuestionBankContentProps) {
  const updateFilter = (key: string, value: string) => {
    const filters = { ...list.state.filters };
    if (value) filters[key] = value;
    else delete filters[key];
    list.setFilters(filters);
  };
  return (
    <QuestionBankDialogs questions={questions} labels={labels}>
      {(actions) => (
        <section className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <Heading level={1}>{labels.title}</Heading>
              <p className="text-foreground-muted">{labels.description}</p>
            </div>
            <Button iconStart="plus" onClick={actions.onCreate}>
              {labels.createQuestion}
            </Button>
          </div>
          {!capabilities.questionBankFilters ? (
            <Alert tone="info">{labels.filtersUnavailable}</Alert>
          ) : null}
          {!capabilities.questionArchive ? (
            <Alert tone="info">{labels.archiveUnavailable}</Alert>
          ) : null}
          <QuestionFilters
            search={list.state.search}
            filters={list.state.filters}
            disabled={!capabilities.questionBankFilters}
            labels={labels}
            onSearch={list.setSearch}
            onFilter={updateFilter}
          />
          {!capabilities.mcqOnly ? (
            <p className="text-sm text-foreground-muted">{labels.showingUnsupported}</p>
          ) : null}
          <QuestionListView
            entries={data.items}
            loading={false}
            archiveEnabled={capabilities.questionArchive}
            labels={labels}
            onEdit={actions.onEdit}
            onPreview={actions.onPreview}
            onArchive={actions.onArchive}
          />
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            pageLabel={labels.listLabel}
            pageSizeLabel={labels.pageSize}
            pageSizePlaceholder={labels.pageSize}
            previousLabel={labels.previous}
            nextLabel={labels.next}
            pageSizeOptions={QUESTION_PAGE_SIZE_OPTIONS}
            pageStatus={(page, pages) =>
              labels.page.replace("{{page}}", String(page)).replace("{{pages}}", String(pages))
            }
            onPageChange={list.setPage}
            onPageSizeChange={list.setPageSize}
          />
        </section>
      )}
    </QuestionBankDialogs>
  );
}
