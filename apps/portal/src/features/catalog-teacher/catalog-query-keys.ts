import type { ListUrlState } from "@noldg/api/contracts/common";

function serializeListState(state: ListUrlState): string {
  return JSON.stringify(state);
}

/** Provides stable query keys for course, lesson, and package server data. */
export const catalogQueryKeys = {
  courses: ["teacher-catalog", "courses"] as const,
  courseList: (state: ListUrlState) =>
    ["teacher-catalog", "courses", serializeListState(state)] as const,
  lessons: (courseId: string) => ["teacher-catalog", "lessons", courseId] as const,
  lessonList: (courseId: string, state: ListUrlState) =>
    ["teacher-catalog", "lessons", courseId, serializeListState(state)] as const,
  products: (courseId: string) => ["teacher-catalog", "products", courseId] as const,
  pricingRoot: ["teacher-catalog", "pricing"] as const,
  pricing: (productId: string) => ["teacher-catalog", "pricing", productId] as const,
};
