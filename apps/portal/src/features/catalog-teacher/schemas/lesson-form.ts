import {
  createLessonFormSchema as createContractFormSchema,
  LESSON_FORM_DEFAULTS,
  type LessonFormValues,
} from "@noldg/api/contracts/catalog-editor";
import { cairoLocalToIso, isAfterNow, isAfterTimestamp } from "../../../shared/time/time";

export { LESSON_FORM_DEFAULTS };
export type { LessonFormValues };

/** Binds the form contract to centralized Cairo-time helpers. @param now Injectable clock for validation tests. */
export function createLessonFormSchema(now: Date | (() => Date)) {
  return createContractFormSchema(now, {
    toIso: cairoLocalToIso,
    isAfterNow,
    isAfterTimestamp,
  });
}
