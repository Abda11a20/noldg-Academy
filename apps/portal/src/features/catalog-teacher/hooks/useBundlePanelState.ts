import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { capabilities } from "@noldg/api/config/capabilities";
import {
  MAX_CATALOG_PRICE_EGP,
  MIN_CATALOG_PRICE_EGP,
  MINIMUM_ANNOUNCED_LESSON_COUNT,
  type CatalogProduct,
  type ProductInput,
  type ProductPricing,
} from "@noldg/api/contracts/catalog";
import { getProductPricing } from "@noldg/api/endpoints/catalog";
import { catalogQueryKeys } from "../catalog-query-keys";
import { useCatalogMutations } from "./useCatalogMutations";
import { useCatalogQueries } from "./useCatalogQueries";

export interface BundleRow {
  product: CatalogProduct;
  pricing: ProductPricing;
}

export interface BundleFormValues {
  name: string;
  price: string;
  announcedLessonCount: string;
  lessonIds: string[];
}

export const EMPTY_BUNDLE_FORM: BundleFormValues = {
  name: "",
  price: "",
  announcedLessonCount: "",
  lessonIds: [],
};

function isValidBundle(form: BundleFormValues): boolean {
  const price = Number(form.price);
  const lessonCount = Number(form.announcedLessonCount);
  return (
    Number.isInteger(price) &&
    price >= MIN_CATALOG_PRICE_EGP &&
    price <= MAX_CATALOG_PRICE_EGP &&
    Number.isInteger(lessonCount) &&
    lessonCount >= MINIMUM_ANNOUNCED_LESSON_COUNT &&
    form.lessonIds.length <= lessonCount
  );
}

/** Owns bundle list queries, editor state, and user actions. @param courseId Course whose packages are managed. */
export function useBundlePanelState(courseId: string) {
  const [editing, setEditing] = useState<CatalogProduct | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_BUNDLE_FORM);
  const [lessonSearch, setLessonSearch] = useState("");
  const [archiveTarget, setArchiveTarget] = useState<CatalogProduct | undefined>();
  const { products, lessons } = useCatalogQueries(
    courseId,
    { page: 1, pageSize: 100, search: "", filters: {} },
    false,
  );
  const mutations = useCatalogMutations(courseId);
  const rows = (products.data ?? []).filter(
    ({ product }) => product.courseId === courseId && product.type === "package",
  );
  const pricingQueries = useQueries({
    queries: rows.map(({ product }) => ({
      queryKey: catalogQueryKeys.pricing(product.id),
      queryFn: ({ signal }: { signal: AbortSignal }) => getProductPricing(product.id, signal),
      enabled: product.status === "active",
    })),
  });
  const pricedRows = rows.map((row, index) => ({
    ...row,
    pricing: pricingQueries[index]?.data?.pricing ?? row.pricing,
  }));
  const lessonRows = lessons.data?.items ?? [];
  const matchingLessons = lessonRows.filter((lesson) =>
    lesson.title.toLocaleLowerCase().includes(lessonSearch.toLocaleLowerCase()),
  );
  const openCreate = () => {
    setEditing(undefined);
    setForm(EMPTY_BUNDLE_FORM);
    setLessonSearch("");
    setDialogOpen(true);
  };
  const openEdit = (product: CatalogProduct) => {
    setEditing(product);
    setDialogOpen(true);
    setLessonSearch("");
    setForm({
      name: product.name,
      price: String(product.price),
      announcedLessonCount: String(product.announcedLessonCount ?? ""),
      lessonIds: product.lessonIds ?? [],
    });
  };
  const toggleLesson = (lessonId: string, checked: boolean | "indeterminate") => {
    setForm((current) => ({
      ...current,
      lessonIds:
        checked === true
          ? [...new Set([...current.lessonIds, lessonId])]
          : current.lessonIds.filter((id) => id !== lessonId),
    }));
  };
  const save = () => {
    const announcedLessonCount = Number(form.announcedLessonCount);
    const price = Number(form.price);
    if (!isValidBundle(form)) return;
    const input: ProductInput = {
      courseId,
      name: form.name.trim(),
      price,
      announcedLessonCount,
      lessonIds: capabilities.bundleLessons ? form.lessonIds : [],
    };
    const mutation = editing
      ? mutations.updatePackageMutation.mutateAsync({ productId: editing.id, input })
      : mutations.createPackageMutation.mutateAsync(input);
    void mutation
      .then(() => {
        setDialogOpen(false);
        setEditing(undefined);
      })
      .catch(() => undefined);
  };
  const archive = () => {
    if (!archiveTarget) return;
    void mutations.updatePackageMutation
      .mutateAsync({ productId: archiveTarget.id, input: { status: "archived" } })
      .catch(() => undefined);
    setArchiveTarget(undefined);
  };
  return {
    archive,
    archiveTarget,
    dialogOpen,
    editing,
    form,
    isPending:
      mutations.createPackageMutation.isPending || mutations.updatePackageMutation.isPending,
    isValid: isValidBundle(form),
    lessonSearch,
    lessons: matchingLessons,
    openCreate,
    openEdit,
    products,
    pricedRows,
    save,
    setArchiveTarget,
    setDialogOpen,
    setEditing,
    setForm,
    setLessonSearch,
    toggleLesson,
  };
}
