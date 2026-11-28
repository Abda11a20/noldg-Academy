import i18next from "../../shared/i18n";
import {
  DEFERRED_ROUTE_NAMESPACES,
  loadRouteNamespace,
} from "../../shared/i18n/load-route-namespace";
import { UIGalleryPage } from "./UIGalleryPage";

/** Loads development-only UI gallery translations and component outside the production bundle. */
export async function loadUiGalleryRoute() {
  if (!i18next.hasResourceBundle("ar", "gallery") || !i18next.hasResourceBundle("en", "gallery")) {
    const [{ default: ar }, { default: en }] = await Promise.all([
      import("../../shared/i18n/locales/ar/gallery.json"),
      import("../../shared/i18n/locales/en/gallery.json"),
    ]);
    i18next.addResourceBundle("ar", "gallery", ar);
    i18next.addResourceBundle("en", "gallery", en);
  }
  await Promise.all([
    ...DEFERRED_ROUTE_NAMESPACES.map((namespace) => loadRouteNamespace(namespace, "ar")),
    ...DEFERRED_ROUTE_NAMESPACES.map((namespace) => loadRouteNamespace(namespace, "en")),
  ]);
  return { Component: UIGalleryPage };
}
