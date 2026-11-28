import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveOrder,
  cancelOrder,
  createManualOrder,
  createOrder,
  getAdminOrders,
  getOrder,
  getOrderSettings,
  getStudentOrders,
  rejectOrder,
} from "@noldg/api/endpoints/orders";
import { getProductPricing } from "@noldg/api/endpoints/catalog";
import type {
  CreateOrderInput,
  ManualOrderInput,
  OrderListQuery,
} from "@noldg/api/contracts/orders";
import { useApiErrorToast } from "../../../shared/errors/useApiErrorToast";
import { orderQueryKeys } from "../orders-query-keys";

/** Loads a student order list from the server. @param query Validated URL-backed list state. */
export function useStudentOrders(query: OrderListQuery) {
  return useQuery({
    queryKey: orderQueryKeys.list("student", query),
    queryFn: ({ signal }) => getStudentOrders(query, signal),
  });
}

/** Loads the account manager's order queue. @param query Validated URL-backed list state. */
export function useAdminOrders(query: OrderListQuery) {
  return useQuery({
    queryKey: orderQueryKeys.list("admin", query),
    queryFn: ({ signal }) => getAdminOrders(query, signal),
  });
}

/** Loads one order and its server-provided price snapshot. @param id Opaque order identifier. @param admin Uses admin detail access. */
export function useOrder(id: string, admin = false) {
  return useQuery({
    queryKey: orderQueryKeys.detail(id, admin ? "admin" : "student"),
    queryFn: ({ signal }) => getOrder(id, admin, signal),
    enabled: Boolean(id),
  });
}

/** Loads the current payment instructions and support contact. */
export function useOrderSettings() {
  return useQuery({
    queryKey: orderQueryKeys.settings(),
    queryFn: ({ signal }) => getOrderSettings(signal),
  });
}

/** Loads the server-authoritative pricing preview for checkout.
 * @param productId Route product identifier.
 */
export function usePricingPreview(productId: string) {
  return useQuery({
    queryKey: orderQueryKeys.pricing(productId),
    queryFn: ({ signal }) => getProductPricing(productId, signal),
    enabled: Boolean(productId),
  });
}

function useOrderMutation<TInput, TResult>(
  mutationFn: (input: TInput) => Promise<TResult>,
  scope: "student" | "admin",
) {
  const queryClient = useQueryClient();
  const reportError = useApiErrorToast();
  return useMutation({
    mutationFn,
    onSuccess: async (result) => {
      if (
        typeof result === "object" &&
        result !== null &&
        "id" in result &&
        typeof result.id === "string"
      )
        queryClient.setQueryData(orderQueryKeys.detail(result.id, scope), result);
      await queryClient.invalidateQueries({ queryKey: orderQueryKeys.root });
    },
    onError: reportError,
  });
}

/** Creates a student order with the supplied stable idempotency key. */
export function useCreateOrder() {
  return useOrderMutation(
    ({ input, key }: { input: CreateOrderInput; key: string }) => createOrder(input, key),
    "student",
  );
}

/** Cancels a pending student order. */
export function useCancelOrder() {
  return useOrderMutation((id: string) => cancelOrder(id), "student");
}

/** Approves a received payment after confirmation. */
export function useApproveOrder() {
  return useOrderMutation((id: string) => approveOrder(id), "admin");
}

/** Rejects an order with a required reason. */
export function useRejectOrder() {
  return useOrderMutation(
    ({ id, reason }: { id: string; reason: string }) => rejectOrder(id, reason),
    "admin",
  );
}

/** Creates and approves a manual cash order. */
export function useCreateManualOrder() {
  return useOrderMutation(
    ({ input, key }: { input: ManualOrderInput; key: string }) => createManualOrder(input, key),
    "admin",
  );
}

/** Creates a fresh key once for a new confirmation attempt. */
export function createConfirmationKey(): string {
  return crypto.randomUUID();
}
