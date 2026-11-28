import type { RouteObject } from "react-router";
import { RouteErrorPage } from "../pages/RouteErrorPage";

/** Provides lazy assessment routes separately to keep the main route table below its size limit. */
export const assessmentRoutes: RouteObject[] = [
  {
    path: "courses/:courseId/assessments/new/:type",
    lazy: async () => {
      const { loadRouteNamespace } = await import("../shared/i18n/load-route-namespace");
      await loadRouteNamespace("assessments");
      return {
        Component: (await import("../features/assessments")).AssessmentBuilderPage,
      };
    },
    errorElement: <RouteErrorPage />,
  },
];
