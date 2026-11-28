import { createBrowserRouter, redirect, type RouteObject } from "react-router";
import { ROUTE_PATHS } from "../shared/navigation/routes";
import { RouteErrorPage } from "../pages/RouteErrorPage";
import type { RouteNamespace } from "../shared/i18n/load-route-namespace";

function lazyWithNamespace(
  namespace: RouteNamespace | readonly RouteNamespace[],
  loadComponent: () => Promise<Pick<RouteObject, "Component">>,
) {
  return async () => {
    await (await import("../shared/i18n/load-route-namespace")).loadRouteNamespace(namespace);
    return loadComponent();
  };
}

function lazyRoute(path: string, lazy: NonNullable<RouteObject["lazy"]>): RouteObject {
  return { path, lazy, errorElement: <RouteErrorPage /> };
}

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
        lazy: lazyWithNamespace("browse", async () => ({
          Component: (await import("../features/student-browse/pages/StudentHomePage"))
            .StudentHomePage,
        })),
      },
      {
        path: "teachers",
        lazy: lazyWithNamespace("browse", async () => ({
          Component: (await import("../features/student-browse/pages/TeachersPage")).TeachersPage,
        })),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "teachers/:teacherId",
        lazy: lazyWithNamespace("browse", async () => ({
          Component: (await import("../features/student-browse/pages/TeacherDetailPage"))
            .TeacherDetailPage,
        })),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "lessons",
        lazy: lazyWithNamespace("learning", async () => ({
          Component: (await import("../features/learning/pages/MyLessonsPage")).MyLessonsPage,
        })),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "lessons/:lessonId",
        lazy: lazyWithNamespace("learning", async () => ({
          Component: (await import("../features/learning/pages/LessonPage")).LessonPage,
        })),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "lessons/:lessonId/quiz",
        lazy: lazyWithNamespace("learning", async () => ({
          Component: (await import("../features/learning/pages/LessonQuizStubPage"))
            .LessonQuizStubPage,
        })),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "checkout/:productId",
        lazy: lazyWithNamespace("orders", async () => ({
          Component: (await import("../features/orders/pages/CheckoutPage")).CheckoutPage,
        })),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "purchases",
        lazy: lazyWithNamespace("orders", async () => ({
          Component: (await import("../features/orders/pages/PurchasesPage")).PurchasesPage,
        })),
        errorElement: <RouteErrorPage />,
      },
      {
        path: "purchases/:orderId",
        lazy: lazyWithNamespace("orders", async () => ({
          Component: (await import("../features/orders/pages/OrderDetailPage")).OrderDetailPage,
        })),
        errorElement: <RouteErrorPage />,
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
        lazy: lazyWithNamespace("catalog", async () => ({
          Component: (await import("../features/catalog-teacher/pages/TeacherCoursesPage"))
            .TeacherCoursesPage,
        })),
      },
      lazyRoute(
        "courses/:courseId",
        lazyWithNamespace(["catalog", "assessments"], async () => ({
          Component: (await import("../features/catalog-teacher/pages/TeacherCoursePage"))
            .TeacherCoursePage,
        })),
      ),
      lazyRoute(
        "courses/:courseId/lessons/new",
        lazyWithNamespace(["catalog", "assessments", "questions"], async () => ({
          Component: (await import("../features/catalog-teacher/pages/LessonEditorPage"))
            .LessonEditorPage,
        })),
      ),
      lazyRoute(
        "courses/:courseId/lessons/:lessonId",
        lazyWithNamespace(["catalog", "assessments", "questions"], async () => ({
          Component: (await import("../features/catalog-teacher/pages/LessonEditorPage"))
            .LessonEditorPage,
        })),
      ),
      lazyRoute(
        "questions",
        lazyWithNamespace("questions", async () => ({
          Component: (await import("../features/question-bank")).QuestionBankPage,
        })),
      ),
      lazyRoute(
        "courses/:courseId/assessments/:assessmentId/:action?/:attemptId?",
        lazyWithNamespace("assessments", async () => ({
          Component: (await import("./AssessmentRouteDispatcher")).AssessmentRouteDispatcher,
        })),
      ),
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
      lazyRoute(
        "academic",
        lazyWithNamespace("admin", async () => ({
          Component: (await import("../features/academic-admin/pages/AcademicPage")).AcademicPage,
        })),
      ),
      lazyRoute(
        "teachers",
        lazyWithNamespace("admin", async () => ({
          Component: (await import("../features/teacher-applications/pages/TeachersPage"))
            .TeachersPage,
        })),
      ),
      lazyRoute(
        "teachers/applications/:applicationId",
        lazyWithNamespace("admin", async () => ({
          Component: (await import("../features/teacher-applications/pages/ApplicationDetailPage"))
            .ApplicationDetailPage,
        })),
      ),
      lazyRoute(
        "orders",
        lazyWithNamespace("orders", async () => ({
          Component: (await import("../features/orders/pages/AdminOrdersPage")).AdminOrdersPage,
        })),
      ),
      lazyRoute(
        "orders/new",
        lazyWithNamespace("orders", async () => ({
          Component: (await import("../features/orders/pages/ManualOrderPage")).ManualOrderPage,
        })),
      ),
      lazyRoute(
        "orders/:orderId",
        lazyWithNamespace("orders", async () => ({
          Component: (await import("../features/orders/pages/AdminOrderDetailPage"))
            .AdminOrderDetailPage,
        })),
      ),
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
    lazy: async () => {
      const { DEFERRED_ROUTE_NAMESPACES, loadRouteNamespace } =
        await import("../shared/i18n/load-route-namespace");
      await loadRouteNamespace(DEFERRED_ROUTE_NAMESPACES);
      return {
        Component: (await import("../pages/ui-gallery/UIGalleryPage")).UIGalleryPage,
      };
    },
    errorElement: <RouteErrorPage />,
  });
}

/** Lazy client router for auth screens, protected placeholders, and development UI gallery. */
export const router = createBrowserRouter(routes);
