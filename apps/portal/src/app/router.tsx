import { createBrowserRouter, redirect, type RouteObject } from "react-router";
import { ROUTE_PATHS } from "./constants/routes";
import { RouteErrorPage } from "../pages/RouteErrorPage";

const routes: RouteObject[] = [
  {
    path: ROUTE_PATHS.home,
    loader: () => redirect(ROUTE_PATHS.student),
    errorElement: <RouteErrorPage />,
  },
  {
    path: ROUTE_PATHS.login,
    lazy: async () => ({ Component: (await import("./layouts/AuthLayout")).AuthLayout }),
    errorElement: <RouteErrorPage />,
  },
  {
    path: ROUTE_PATHS.student,
    lazy: async () => ({ Component: (await import("./layouts/StudentLayout")).StudentLayout }),
    errorElement: <RouteErrorPage />,
  },
  {
    path: ROUTE_PATHS.teacher,
    lazy: async () => ({ Component: (await import("./layouts/TeacherLayout")).TeacherLayout }),
    errorElement: <RouteErrorPage />,
  },
  {
    path: ROUTE_PATHS.admin,
    lazy: async () => ({ Component: (await import("./layouts/AdminLayout")).AdminLayout }),
    errorElement: <RouteErrorPage />,
  },
  {
    path: ROUTE_PATHS.notFound,
    lazy: async () => ({ Component: (await import("../pages/NotFoundPage")).NotFoundPage }),
    errorElement: <RouteErrorPage />,
  },
  {
    path: ROUTE_PATHS.catchAll,
    lazy: async () => ({ Component: (await import("../pages/NotFoundPage")).NotFoundPage }),
    errorElement: <RouteErrorPage />,
  },
];

if (import.meta.env.DEV || import.meta.env.VITE_INCLUDE_UI_GALLERY === "true") {
  routes.push({
    path: ROUTE_PATHS.uiGallery,
    lazy: async () => ({
      Component: (await import("../pages/ui-gallery/UIGalleryPage")).UIGalleryPage,
    }),
    errorElement: <RouteErrorPage />,
  });
}

/** Lazy client router for the portal shell and development UI gallery. */
export const router = createBrowserRouter(routes);
