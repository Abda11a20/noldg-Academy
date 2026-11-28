import i18next from "./index";

type SupportedLanguage = "ar" | "en";
type ResourceLoader = () => Promise<{ default: Record<string, unknown> }>;

const namespaceLoaders: Record<RouteNamespace, Record<SupportedLanguage, ResourceLoader>> = {
  admin: {
    ar: () => import("./locales/ar/admin.json"),
    en: () => import("./locales/en/admin.json"),
  },
  browse: {
    ar: () => import("./locales/ar/browse.json"),
    en: () => import("./locales/en/browse.json"),
  },
  catalog: {
    ar: () => import("./locales/ar/catalog.json"),
    en: () => import("./locales/en/catalog.json"),
  },
  orders: {
    ar: () => import("./locales/ar/orders.json"),
    en: () => import("./locales/en/orders.json"),
  },
  learning: {
    ar: () => import("./locales/ar/learning.json"),
    en: () => import("./locales/en/learning.json"),
  },
  questions: {
    ar: () => import("./locales/ar/questions.json"),
    en: () => import("./locales/en/questions.json"),
  },
  assessments: {
    ar: () => import("./locales/ar/assessments.json"),
    en: () => import("./locales/en/assessments.json"),
  },
};

export type RouteNamespace =
  "admin" | "browse" | "catalog" | "orders" | "learning" | "questions" | "assessments";

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

const loadedNamespaces = new Set<RouteNamespace>();

function resolveLanguage(language: string | undefined): SupportedLanguage {
  return language?.startsWith("en") ? "en" : "ar";
}

async function loadNamespaceForLanguage(
  namespace: RouteNamespace,
  language: SupportedLanguage,
): Promise<void> {
  if (i18next.hasResourceBundle(language, namespace)) return;
  const resource = await namespaceLoaders[namespace][language]();
  i18next.addResourceBundle(language, namespace, resource.default, true, true);
}

/** Loads all already-activated route namespaces for the specified language.
 * @param language Target language code.
 */
export async function loadActiveRouteNamespaces(language: SupportedLanguage): Promise<void> {
  await Promise.all(
    [...loadedNamespaces].map((namespace) => loadNamespaceForLanguage(namespace, language)),
  );
}

i18next.on("languageChanged", (nextLanguage) => {
  void loadActiveRouteNamespaces(resolveLanguage(nextLanguage));
});

/** Loads one or more deferred feature namespaces for the active (or specified) language before a route renders.
 * @param namespace Route translation namespace, or a readonly list loaded in parallel.
 * @param language Optional explicit language override.
 */
export async function loadRouteNamespace(
  namespace: RouteNamespace | readonly RouteNamespace[],
  language?: SupportedLanguage,
): Promise<void> {
  if (typeof namespace !== "string") {
    await Promise.all(namespace.map((item) => loadRouteNamespace(item, language)));
    return;
  }
  loadedNamespaces.add(namespace);
  const targetLanguage = language ?? resolveLanguage(i18next.resolvedLanguage ?? i18next.language);
  await loadNamespaceForLanguage(namespace, targetLanguage);
}
