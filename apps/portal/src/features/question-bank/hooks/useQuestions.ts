import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppError } from "@noldg/api/errors";
import {
  archiveQuestion,
  createQuestion,
  listQuestions,
  restoreQuestion,
  updateQuestion,
} from "@noldg/api/endpoints/questions";
import { QuestionListQuerySchema, type QuestionInput } from "@noldg/api/contracts/assessments";
import { useTranslation } from "react-i18next";
import { useToast } from "@noldg/ui";
import { useApiErrorToast } from "../../../shared/errors/useApiErrorToast";
import { questionBankQueryKeys } from "../question-bank-query-keys";

/** Loads URL-backed question filters and provides cache-aware question mutations.
 * @param state Shared validated page, search, and filter state.
 * @returns Query data and mutations for create, edit, archive, and restore.
 */
export function useQuestions(state: {
  page: number;
  pageSize: number;
  search: string;
  filters: Record<string, string>;
}) {
  const query = useMemo(
    () =>
      QuestionListQuerySchema.parse({
        page: state.page,
        pageSize: state.pageSize,
        search: state.search,
        ...state.filters,
      }),
    [state],
  );
  const queryClient = useQueryClient();
  const reportError = useApiErrorToast();
  const { notify } = useToast();
  const { t } = useTranslation("questions");
  const queryResult = useQuery({
    queryKey: questionBankQueryKeys.list(query),
    queryFn: ({ signal }) => listQuestions(query, signal),
  });
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: questionBankQueryKeys.root });
  };
  const onError = (error: Error) => {
    if (error instanceof AppError && error.code === "QUESTION_IN_USE") {
      notify({ title: t("questionInUse"), tone: "danger" });
      return;
    }
    if (error instanceof AppError && error.code === "QUESTION_INVALID") {
      notify({ title: t("validationError"), tone: "danger" });
      return;
    }
    reportError(error);
  };
  const create = useMutation({
    mutationFn: createQuestion,
    onSuccess: async () => {
      await refresh();
      notify({ title: t("createSuccess"), tone: "success" });
    },
    onError,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<QuestionInput> }) =>
      updateQuestion(id, input),
    onSuccess: async () => {
      await refresh();
      notify({ title: t("updateSuccess"), tone: "success" });
    },
    onError,
  });
  const archive = useMutation({
    mutationFn: archiveQuestion,
    onSuccess: async () => {
      await refresh();
      notify({ title: t("archiveSuccess"), tone: "success" });
    },
    onError,
  });
  const restore = useMutation({
    mutationFn: restoreQuestion,
    onSuccess: async () => {
      await refresh();
      notify({ title: t("restoreSuccess"), tone: "success" });
    },
    onError,
  });
  return { query: queryResult, create, update, archive, restore };
}
