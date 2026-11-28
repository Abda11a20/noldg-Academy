import type { RouteObject } from "react-router";
import { RouteErrorPage } from "../pages/RouteErrorPage";

/** Provides the lazy assessment route subtree to the teacher shell. */
export const assessmentRoutes: RouteObject[] = [
  {
    path: "courses/:courseId/assessments/:assessmentId/:action?/:attemptId?",
    lazy: async () => {
      const { loadRouteNamespace } = await import("../shared/i18n/load-route-namespace");
      await loadRouteNamespace("assessments");
      return {
        Component: (await import("./AssessmentRouteDispatcher")).AssessmentRouteDispatcher,
      };
    },
    errorElement: <RouteErrorPage />,
  },
];
