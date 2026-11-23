import { createBrowserRouter, redirect, type RouteObject } from "react-router";
import { ROUTE_PATHS } from "../shared/navigation/routes";
import { RouteErrorPage } from "../pages/RouteErrorPage";

const routes: RouteObject[] = [
  {
    path: "/",
    lazy: async () => ({ Component: (await import("./layouts/AuthLayout")).AuthLayout }),
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, loader: () => redirect(ROUTE_PATHS.login) },
      {
        path: "login",
        lazy: async () => ({ Component: (await import("../features/auth")).LoginPage }),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "register",
        lazy: async () => ({ Component: (await import("../features/auth")).RegisterChoicePage }),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "register/student",
        lazy: async () => ({
          Component: (await import("../features/auth")).StudentRegistrationPage,
        }),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "register/teacher",
        lazy: async () => ({
          Component: (await import("../features/auth")).TeacherRegistrationPage,
        }),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "verify-email",
        lazy: async () => ({ Component: (await import("../features/auth")).VerifyEmailPage }),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "forgot-password",
        lazy: async () => ({ Component: (await import("../features/auth")).ForgotPasswordPage }),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "reset-password",
        lazy: async () => ({ Component: (await import("../features/auth")).ResetPasswordPage }),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "device-blocked",
        lazy: async () => ({ Component: (await import("../features/auth")).DeviceBlockedPage }),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "teacher/pending",
        lazy: async () => ({ Component: (await import("../features/auth")).TeacherPendingPage }),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "account-suspended",
        lazy: async () => ({ Component: (await import("../features/auth")).AccountSuspendedPage }),
        errorElement: <RouteErrorPage />,
      },
    ],
  },
  {
    path: ROUTE_PATHS.student,
    lazy: async () => ({ Component: (await import("./layouts/StudentLayout")).StudentLayout }),
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import("../features/auth")).RoleLandingPage }),
      },
    ],
  },
  {
    path: ROUTE_PATHS.teacher,
    lazy: async () => ({ Component: (await import("./layouts/TeacherLayout")).TeacherLayout }),
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import("../features/auth")).RoleLandingPage }),
      },
    ],
  },
  {
    path: ROUTE_PATHS.admin,
    lazy: async () => ({ Component: (await import("./layouts/AdminLayout")).AdminLayout }),
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import("../features/auth")).RoleLandingPage }),
      },
    ],
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

/** Lazy client router for auth screens, protected placeholders, and development UI gallery. */
export const router = createBrowserRouter(routes);
