import type { OrderListQuery } from "@noldg/api/contracts/orders";

/** Typed order query keys keep list, detail, and settings invalidation precise. */
export const orderQueryKeys = {
  root: ["orders"] as const,
  lists: () => [...orderQueryKeys.root, "list"] as const,
  list: (scope: "student" | "admin", query: OrderListQuery) =>
    [...orderQueryKeys.lists(), scope, query] as const,
  details: () => [...orderQueryKeys.root, "detail"] as const,
  detail: (id: string, scope: "student" | "admin" = "student") =>
    [...orderQueryKeys.details(), scope, id] as const,
  settings: () => [...orderQueryKeys.root, "settings"] as const,
  pricing: (productId: string) => ["products", "pricing", productId] as const,
};
