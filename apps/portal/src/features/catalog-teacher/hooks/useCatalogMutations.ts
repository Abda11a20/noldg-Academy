import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useToast } from "@noldg/ui";
import type { CatalogLesson, LessonInput, ProductInput } from "@noldg/api/contracts/catalog";
import {
  createCourseLesson,
  createLessonProduct,
  updateCourseLesson,
  updateCourseLessonStatus,
  updatePackageProduct,
} from "@noldg/api/endpoints/catalog";
import { useApiErrorToast } from "../../../shared/errors/useApiErrorToast";
import { catalogQueryKeys } from "../catalog-query-keys";

/** Provides catalog mutations with targeted cache invalidation and shared error toasts. */
export function useCatalogMutations(courseId: string) {
  const queryClient = useQueryClient();
  const reportError = useApiErrorToast();
  const { notify } = useToast();
  const { t } = useTranslation("catalog");
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const invalidateLessonData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: catalogQueryKeys.lessons(courseId) }),
      queryClient.invalidateQueries({ queryKey: catalogQueryKeys.products(courseId) }),
      queryClient.invalidateQueries({ queryKey: catalogQueryKeys.pricingRoot }),
    ]);
  }, [courseId, queryClient]);
  const onError = (error: Error) => reportError(error);
  const saveLesson = useCallback(
    async (input: LessonInput, lessonId?: string): Promise<CatalogLesson | undefined> => {
      setIsSavingLesson(true);
      try {
        const lesson = lessonId
          ? await updateCourseLesson(lessonId, input)
          : await createCourseLesson(courseId, input);
        await invalidateLessonData();
        if (!lessonId)
          notify({
            title: t(input.status === "published" ? "lessonPublished" : "lessonSaved"),
            tone: "success",
          });
        return lesson;
      } catch (error) {
        reportError(error);
        return undefined;
      } finally {
        setIsSavingLesson(false);
      }
    },
    [courseId, invalidateLessonData, notify, reportError, t],
  );
  const changeLessonStatusMutation = useMutation({
    mutationFn: ({
      lessonId,
      status,
    }: {
      lessonId: string;
      status: "draft" | "published" | "archived";
    }) => updateCourseLessonStatus(lessonId, status),
    onSuccess: async (_lesson, variables) => {
      await invalidateLessonData();
      notify({
        title: t(variables.status === "published" ? "lessonPublished" : "lessonSaved"),
        tone: "success",
      });
    },
    onError,
  });
  const createPackageMutation = useMutation({
    mutationFn: (input: ProductInput) => createLessonProduct(input),
    onSuccess: async () => {
      await invalidateLessonData();
      notify({ title: t("bundleSaved"), tone: "success" });
    },
    onError,
  });
  const updatePackageMutation = useMutation({
    mutationFn: ({ productId, input }: { productId: string; input: Partial<ProductInput> }) =>
      updatePackageProduct(productId, input),
    onSuccess: async (_result, variables) => {
      await invalidateLessonData();
      notify({
        title: t(variables.input.status === "archived" ? "bundleArchived" : "bundleSaved"),
        tone: "success",
      });
    },
    onError,
  });
  return {
    saveLesson,
    isSavingLesson,
    changeLessonStatusMutation,
    createPackageMutation,
    updatePackageMutation,
  };
}
