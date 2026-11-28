import i18next from "./index";

const namespaceLoaders = {
  admin: async () => {
    const [{ default: ar }, { default: en }] = await Promise.all([
      import("./locales/ar/admin.json"),
      import("./locales/en/admin.json"),
    ]);
    return { ar, en };
  },
  browse: async () => {
    const [{ default: ar }, { default: en }] = await Promise.all([
      import("./locales/ar/browse.json"),
      import("./locales/en/browse.json"),
    ]);
    return { ar, en };
  },
  catalog: async () => {
    const [{ default: ar }, { default: en }] = await Promise.all([
      import("./locales/ar/catalog.json"),
      import("./locales/en/catalog.json"),
    ]);
    return { ar, en };
  },
  orders: async () => {
    const [{ default: ar }, { default: en }] = await Promise.all([
      import("./locales/ar/orders.json"),
      import("./locales/en/orders.json"),
    ]);
    return { ar, en };
  },
  learning: async () => {
    const [{ default: ar }, { default: en }] = await Promise.all([
      import("./locales/ar/learning.json"),
      import("./locales/en/learning.json"),
    ]);
    return { ar, en };
  },
  questions: async () => {
    const [{ default: ar }, { default: en }] = await Promise.all([
      import("./locales/ar/questions.json"),
      import("./locales/en/questions.json"),
    ]);
    return { ar, en };
  },
  assessments: async () => {
    const [{ default: ar }, { default: en }] = await Promise.all([
      import("./locales/ar/assessments.json"),
      import("./locales/en/assessments.json"),
    ]);
    return { ar, en };
  },
};

export type RouteNamespace = keyof typeof namespaceLoaders;

/** Namespaces deferred from the initial authentication route. */
export const DEFERRED_ROUTE_NAMESPACES = [
  "admin",
  "browse",
  "catalog",
  "orders",
  "learning",
  "questions",
  "assessments",
] as const;

/** Loads one or more deferred bilingual feature namespaces before a route renders.
 * @param namespace Namespace name or a readonly list loaded in parallel.
 */
export async function loadRouteNamespace(
  namespace: RouteNamespace | readonly RouteNamespace[],
): Promise<void> {
  if (typeof namespace !== "string") {
    await Promise.all(namespace.map(loadRouteNamespace));
    return;
  }
  if (i18next.hasResourceBundle("ar", namespace) && i18next.hasResourceBundle("en", namespace)) {
    return;
  }

  const resources = await namespaceLoaders[namespace]();
  i18next.addResourceBundle("ar", namespace, resources.ar);
  i18next.addResourceBundle("en", namespace, resources.en);
}
