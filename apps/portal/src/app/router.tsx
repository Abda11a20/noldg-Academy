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
        lazy: async () => ({
          Component: (await import("../features/auth/pages/LoginPage")).LoginPage,
        }),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "register",
        lazy: async () => ({
          Component: (await import("../features/auth/pages/RegisterChoicePage")).RegisterChoicePage,
        }),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "register/student",
        lazy: async () => ({
          Component: (await import("../features/auth/pages/StudentRegistrationPage"))
            .StudentRegistrationPage,
        }),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "register/teacher",
        lazy: async () => ({
          Component: (await import("../features/auth/pages/TeacherRegistrationPage"))
            .TeacherRegistrationPage,
        }),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "verify-email",
        lazy: async () => ({
          Component: (await import("../features/auth/pages/VerifyEmailPage")).VerifyEmailPage,
        }),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "forgot-password",
        lazy: async () => ({
          Component: (await import("../features/auth/pages/ForgotPasswordPage")).ForgotPasswordPage,
        }),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "reset-password",
        lazy: async () => ({
          Component: (await import("../features/auth/pages/ResetPasswordPage")).ResetPasswordPage,
        }),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "device-blocked",
        lazy: async () => ({
          Component: (await import("../features/auth/pages/DeviceBlockedPage")).DeviceBlockedPage,
        }),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "teacher/pending",
        lazy: async () => ({
          Component: (await import("../features/auth/pages/TeacherPendingPage")).TeacherPendingPage,
        }),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "account-suspended",
        lazy: async () => ({
          Component: (await import("../features/auth/pages/AccountSuspendedPage"))
            .AccountSuspendedPage,
        }),
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
        lazy: async () => ({
          Component: (await import("../features/auth/pages/RoleLandingPage")).RoleLandingPage,
        }),
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
        lazy: async () => ({
          Component: (await import("../features/catalog-teacher/pages/TeacherCoursesPage"))
            .TeacherCoursesPage,
        }),
      },
      {
        path: "courses/:courseId",
        lazy: async () => ({
          Component: (await import("../features/catalog-teacher/pages/TeacherCoursePage"))
            .TeacherCoursePage,
        }),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "courses/:courseId/lessons/new",
        lazy: async () => ({
          Component: (await import("../features/catalog-teacher/pages/LessonEditorPage"))
            .LessonEditorPage,
        }),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "courses/:courseId/lessons/:lessonId",
        lazy: async () => ({
          Component: (await import("../features/catalog-teacher/pages/LessonEditorPage"))
            .LessonEditorPage,
        }),
        errorElement: <RouteErrorPage />,
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
        lazy: async () => ({
          Component: (await import("../features/auth/pages/RoleLandingPage")).RoleLandingPage,
        }),
      },
      {
        path: "academic",
        lazy: async () => ({
          Component: (await import("../features/academic-admin/pages/AcademicPage")).AcademicPage,
        }),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "teachers",
        lazy: async () => ({
          Component: (await import("../features/teacher-applications/pages/TeachersPage"))
            .TeachersPage,
        }),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "teachers/applications/:applicationId",
        lazy: async () => ({
          Component: (await import("../features/teacher-applications/pages/ApplicationDetailPage"))
            .ApplicationDetailPage,
        }),
        errorElement: <RouteErrorPage />,
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
