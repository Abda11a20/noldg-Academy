/** A minimal SVG path definition stored in the design-system icon registry. */
interface IconDefinition {
  readonly path: string;
}

/** Menu icon definition. */
export const IconMenu: IconDefinition = { path: "M4 6h16M4 12h16M4 18h16" };
/** Close icon definition. */
export const IconClose: IconDefinition = { path: "m6 6 12 12M18 6 6 18" };
/** Search icon definition. */
export const IconSearch: IconDefinition = {
  path: "m20 20-4.2-4.2M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z",
};
/** User icon definition. */
export const IconUser: IconDefinition = {
  path: "M20 21a8 8 0 0 0-16 0m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
};
/** Check icon definition. */
export const IconCheck: IconDefinition = { path: "m5 12 4 4L19 6" };
/** Alert icon definition. */
export const IconAlert: IconDefinition = {
  path: "M12 9v4m0 4h.01M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3l-7.6-13.1a2 2 0 0 0-3.4 0Z",
};
/** Start-direction chevron icon definition. */
export const IconChevronStart: IconDefinition = { path: "m15 18-6-6 6-6" };
/** End-direction chevron icon definition. */
export const IconChevronEnd: IconDefinition = { path: "m9 18 6-6-6-6" };
/** Globe icon definition. */
export const IconGlobe: IconDefinition = {
  path: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm-8-10h16M12 2a15 15 0 0 1 0 20m0-20a15 15 0 0 0 0 20",
};
/** Loader icon definition. */
export const IconLoader: IconDefinition = {
  path: "M12 2v4m0 12v4m10-10h-4M6 12H2m17.07 7.07-2.83-2.83M7.76 7.76 4.93 4.93m14.14 0-2.83 2.83M7.76 16.24l-2.83 2.83",
};

/** Supported icon names and their registry definitions. */
export const iconRegistry = {
  menu: IconMenu,
  close: IconClose,
  search: IconSearch,
  user: IconUser,
  check: IconCheck,
  alert: IconAlert,
  chevronStart: IconChevronStart,
  chevronEnd: IconChevronEnd,
  globe: IconGlobe,
  loader: IconLoader,
} as const;

export type IconName = keyof typeof iconRegistry;
export type IconDirection = "ltr" | "rtl" | "auto";

/** Returns the single direction behavior for directional glyphs, including inherited document direction. */
export function getIconDirectionBehavior(
  name: IconName,
  direction: IconDirection,
): "flip" | "auto" | "none" {
  if (name !== "chevronStart" && name !== "chevronEnd") return "none";
  if (direction === "rtl") return "flip";
  return direction === "auto" ? "auto" : "none";
}
