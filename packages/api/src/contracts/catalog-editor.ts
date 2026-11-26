import { z } from "zod";
import { MAX_CATALOG_PRICE_EGP, MIN_CATALOG_PRICE_EGP } from "./catalog";

export const LessonFormSchema = z.object({
  title: z.string().trim().min(1, "catalog:lessonTitleRequired").max(150),
  description: z.string().max(5000),
  availableFromLocal: z.string().min(1, "catalog:timeRequired"),
  availableUntilLocal: z.string().min(1, "catalog:timeRequired"),
  access: z.enum(["free", "paid"]),
  price: z.string(),
});

export type LessonFormValues = z.infer<typeof LessonFormSchema>;

export interface LessonTimeValidation {
  toIso: (localTime: string) => string;
  isAfterNow: (timestamp: string, now: Date) => boolean;
  isAfterTimestamp: (timestamp: string, otherTimestamp: string) => boolean;
}

function validateWindow(
  values: LessonFormValues,
  context: z.RefinementCtx,
  now: Date | (() => Date),
  time: LessonTimeValidation,
): void {
  let start: string | undefined;
  let end: string | undefined;
  try {
    start = time.toIso(values.availableFromLocal);
  } catch {
    context.addIssue({
      code: "custom",
      path: ["availableFromLocal"],
      message: "catalog:timeInvalid",
    });
  }
  try {
    end = time.toIso(values.availableUntilLocal);
  } catch {
    context.addIssue({
      code: "custom",
      path: ["availableUntilLocal"],
      message: "catalog:timeInvalid",
    });
  }
  if (!start || !end) return;
  if (!time.isAfterTimestamp(end, start)) {
    context.addIssue({
      code: "custom",
      path: ["availableUntilLocal"],
      message: "catalog:windowInvalid",
    });
  }
  const currentTime = typeof now === "function" ? now() : now;
  if (!time.isAfterNow(end, currentTime)) {
    context.addIssue({
      code: "custom",
      path: ["availableUntilLocal"],
      message: "catalog:endMustBeFuture",
    });
  }
}

function validatePrice(values: LessonFormValues, context: z.RefinementCtx): void {
  const price = Number(values.price);
  const invalid =
    !/^\d+$/.test(values.price) || price < MIN_CATALOG_PRICE_EGP || price > MAX_CATALOG_PRICE_EGP;
  if (values.access === "paid" && invalid) {
    context.addIssue({ code: "custom", path: ["price"], message: "catalog:priceMustBeInteger" });
  }
}

/** Creates time-sensitive lesson form validation using the shared Cairo-time helpers. @param now Injectable clock. @param time Central time conversion and comparison helpers. */
export function createLessonFormSchema(now: Date | (() => Date), time: LessonTimeValidation) {
  return LessonFormSchema.superRefine((values, context) => {
    validateWindow(values, context, now, time);
    validatePrice(values, context);
  });
}

export const LESSON_FORM_DEFAULTS: LessonFormValues = {
  title: "",
  description: "",
  availableFromLocal: "",
  availableUntilLocal: "",
  access: "free",
  price: "",
};
