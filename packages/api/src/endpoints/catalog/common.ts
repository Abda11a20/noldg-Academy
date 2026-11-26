import { z } from "zod";
import { AppError } from "../../errors/app-error";
import { apiMode } from "../../mocks/mode";

/** Schema used when the transport validates a response in the endpoint layer. */
export const unknownResponseSchema = z.unknown();

/** Builds request options without passing an undefined signal to fetch. */
export function signalOption(signal?: AbortSignal): { signal?: AbortSignal } {
  return signal ? { signal } : {};
}

/** Throws a normalized error when a current backend capability is unavailable. */
export function requireCapability(available: boolean): void {
  if (apiMode === "mock" || available) return;
  throw new AppError({
    code: "CAPABILITY_UNAVAILABLE",
    status: 501,
    message_key: "errors:capabilityUnavailable",
  });
}

/** Returns array data from the target or legacy list response envelopes. */
export function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "object" && value !== null && "items" in value && Array.isArray(value.items))
    return value.items;
  if (typeof value === "object" && value !== null && "data" in value && Array.isArray(value.data))
    return value.data;
  return [];
}
