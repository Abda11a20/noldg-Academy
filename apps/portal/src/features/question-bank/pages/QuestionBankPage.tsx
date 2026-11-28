import { useListUrlState } from "../../../shared/navigation/useListUrlState";
import { QuestionBankContent } from "../components/QuestionBankContent";
import { QuestionBankLoadState } from "../components/QuestionBankLoadState";
import { useQuestionBankLabels } from "../hooks/useQuestionBankLabels";
import { useQuestions } from "../hooks/useQuestions";

/** Renders the teacher's URL-filtered MCQ bank with legacy entries kept read-only.
 * @returns Question list, editor, preview, and archive controls.
 */
export function QuestionBankPage() {
  const list = useListUrlState();
  const questions = useQuestions(list.state);
  const labels = useQuestionBankLabels();
  if (questions.query.isPending || questions.query.isError)
    return (
      <QuestionBankLoadState
        pending={questions.query.isPending}
        error={questions.query.error}
        labels={labels}
        onRetry={() => void questions.query.refetch()}
      />
    );
  return (
    <QuestionBankContent
      list={list}
      questions={questions}
      data={questions.query.data}
      labels={labels}
    />
  );
}
