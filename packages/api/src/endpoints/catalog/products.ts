import { adaptProduct, unwrapCatalogData } from "../../adapters/catalog";
import { AppError } from "../../errors/app-error";
import { capabilities } from "../../config/capabilities";
import { request } from "../../http/client";
import {
  CatalogProductSchema,
  ProductInputSchema,
  ProductInputWithLessonLimitSchema,
  ProductPricingSchema,
  type ProductInput,
} from "../../contracts/catalog";
import { apiMode } from "../../mocks/mode";
import { asArray, requireCapability, signalOption, unknownResponseSchema } from "./common";

type PossiblyUndefined<T> = { [Key in keyof T]?: T[Key] | undefined };

function assertBundleLessonLimit(values: PossiblyUndefined<ProductInput>): void {
  if (
    values.lessonIds &&
    values.announcedLessonCount !== undefined &&
    values.lessonIds.length > values.announcedLessonCount
  ) {
    throw new AppError({
      code: "VALIDATION_ERROR",
      status: 400,
      message_key: "errors:fieldInvalid",
    });
  }
}

function liveProductBody(values: PossiblyUndefined<ProductInput>): Record<string, unknown> {
  return {
    ...(values.name !== undefined ? { name: values.name } : {}),
    ...(values.price !== undefined ? { price: values.price } : {}),
    ...(values.announcedLessonCount !== undefined
      ? { announcedLessonCount: values.announcedLessonCount }
      : {}),
    ...(values.status !== undefined ? { isActive: values.status === "active" } : {}),
  };
}

/** Lists teacher products and adapts the server-computed pricing preview. */
export async function listTeacherProducts(signal?: AbortSignal) {
  const payload = await request("products/my", unknownResponseSchema, signalOption(signal));
  const rawItems = asArray(unwrapCatalogData(payload));
  const adapted = rawItems.map((item) => {
    if (typeof item !== "object" || item === null || !("product" in item))
      throw new AppError({
        code: "RESPONSE_VALIDATION_FAILED",
        status: 502,
        message_key: "errors:invalidResponse",
      });
    const record = item as Record<string, unknown>;
    return {
      product: CatalogProductSchema.parse(adaptProduct(record.product, apiMode)),
      pricing: ProductPricingSchema.parse(record.pricing),
    };
  });
  return adapted;
}

/** Creates a lesson or package product using the authoritative backend price. */
export async function createLessonProduct(input: ProductInput & { lessonId?: string }) {
  const values = ProductInputWithLessonLimitSchema.parse(input);
  requireCapability(capabilities.bundleLessons || values.lessonIds.length === 0);
  const body =
    apiMode === "mock"
      ? {
          ...values,
          type: input.lessonId ? "lesson" : "package",
          ...(input.lessonId ? { lessonId: input.lessonId } : {}),
        }
      : input.lessonId
        ? {
            courseId: values.courseId,
            type: "lesson",
            lessonId: input.lessonId,
            price: values.price,
          }
        : {
            courseId: values.courseId,
            type: "package",
            name: values.name,
            price: values.price,
            announcedLessonCount: values.announcedLessonCount,
          };
  const payload = await request("products", unknownResponseSchema, { method: "POST", body });
  const data = unwrapCatalogData(payload);
  if (typeof data !== "object" || data === null || !("product" in data) || !("pricing" in data))
    throw new AppError({
      code: "RESPONSE_VALIDATION_FAILED",
      status: 502,
      message_key: "errors:invalidResponse",
    });
  const record = data as Record<string, unknown>;
  return {
    product: CatalogProductSchema.parse(adaptProduct(record.product, apiMode)),
    pricing: ProductPricingSchema.parse(record.pricing),
  };
}

/** Updates a package product after validating its target input shape. */
export async function updatePackageProduct(productId: string, input: Partial<ProductInput>) {
  const values = ProductInputSchema.partial().parse(input);
  assertBundleLessonLimit(values);
  requireCapability(capabilities.bundleLessons || values.lessonIds === undefined);
  const body = apiMode === "mock" ? values : liveProductBody(values);
  const payload = await request(
    `products/${encodeURIComponent(productId)}`,
    unknownResponseSchema,
    {
      method: "PATCH",
      body,
    },
  );
  const data = unwrapCatalogData(payload);
  if (typeof data !== "object" || data === null || !("product" in data) || !("pricing" in data)) {
    throw new AppError({
      code: "RESPONSE_VALIDATION_FAILED",
      status: 502,
      message_key: "errors:invalidResponse",
    });
  }
  const record = data as Record<string, unknown>;
  return {
    product: CatalogProductSchema.parse(adaptProduct(record.product, apiMode)),
    pricing: ProductPricingSchema.parse(record.pricing),
  };
}

/** Loads a product's server-computed current student price. */
export async function getProductPricing(productId: string, signal?: AbortSignal) {
  const payload = await request(
    `products/${encodeURIComponent(productId)}/pricing`,
    unknownResponseSchema,
    signalOption(signal),
  );
  const data = unwrapCatalogData(payload);
  if (typeof data !== "object" || data === null || !("product" in data) || !("pricing" in data))
    throw new AppError({
      code: "RESPONSE_VALIDATION_FAILED",
      status: 502,
      message_key: "errors:invalidResponse",
    });
  const record = data as Record<string, unknown>;
  return {
    product: CatalogProductSchema.parse(adaptProduct(record.product, apiMode)),
    pricing: ProductPricingSchema.parse(record.pricing),
  };
}
