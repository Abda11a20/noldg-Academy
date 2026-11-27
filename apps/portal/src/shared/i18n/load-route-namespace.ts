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
] as const;

/** Loads a deferred bilingual feature namespace before its route renders. */
export async function loadRouteNamespace(namespace: RouteNamespace): Promise<void> {
  if (i18next.hasResourceBundle("ar", namespace) && i18next.hasResourceBundle("en", namespace)) {
    return;
  }

  const resources = await namespaceLoaders[namespace]();
  i18next.addResourceBundle("ar", namespace, resources.ar);
  i18next.addResourceBundle("en", namespace, resources.en);
}
