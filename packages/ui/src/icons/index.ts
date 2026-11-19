import { createElement, lazy, type ComponentType, type LazyExoticComponent } from "react";
import { Globe, type LucideProps } from "lucide-react";

const iconNames = [
  "menu",
  "close",
  "search",
  "user",
  "users",
  "lock",
  "mail",
  "phone",
  "eye",
  "eyeOff",
  "check",
  "x",
  "plus",
  "minus",
  "edit",
  "trash",
  "upload",
  "download",
  "calendar",
  "clock",
  "play",
  "pause",
  "book",
  "graduationCap",
  "wallet",
  "bell",
  "settings",
  "logOut",
  "home",
  "filter",
  "sort",
  "info",
  "alert",
  "success",
  "chevronDown",
  "chevronUp",
  "chevronStart",
  "chevronEnd",
  "chevronsStart",
  "chevronsEnd",
  "arrowStart",
  "arrowEnd",
  "star",
  "starFilled",
  "globe",
  "loader",
  "file",
  "image",
  "video",
] as const;

export type IconName = (typeof iconNames)[number];
export type IconDirection = "ltr" | "rtl" | "auto";

type LazyIconComponent = LazyExoticComponent<ComponentType<LucideProps>>;

function createLazyIcon(name: Exclude<IconName, "globe">): LazyIconComponent {
  return lazy(async () => {
    const { default: GlyphRenderer } = await import("./GlyphRenderer");
    return {
      default: function RegisteredIcon(props: LucideProps) {
        return createElement(GlyphRenderer, { ...props, name });
      },
    };
  });
}

/** Registry of approved icons; all non-shell glyphs load only when first rendered. */
export const iconRegistry = {
  menu: createLazyIcon("menu"),
  close: createLazyIcon("close"),
  search: createLazyIcon("search"),
  user: createLazyIcon("user"),
  users: createLazyIcon("users"),
  lock: createLazyIcon("lock"),
  mail: createLazyIcon("mail"),
  phone: createLazyIcon("phone"),
  eye: createLazyIcon("eye"),
  eyeOff: createLazyIcon("eyeOff"),
  check: createLazyIcon("check"),
  x: createLazyIcon("x"),
  plus: createLazyIcon("plus"),
  minus: createLazyIcon("minus"),
  edit: createLazyIcon("edit"),
  trash: createLazyIcon("trash"),
  upload: createLazyIcon("upload"),
  download: createLazyIcon("download"),
  calendar: createLazyIcon("calendar"),
  clock: createLazyIcon("clock"),
  play: createLazyIcon("play"),
  pause: createLazyIcon("pause"),
  book: createLazyIcon("book"),
  graduationCap: createLazyIcon("graduationCap"),
  wallet: createLazyIcon("wallet"),
  bell: createLazyIcon("bell"),
  settings: createLazyIcon("settings"),
  logOut: createLazyIcon("logOut"),
  home: createLazyIcon("home"),
  filter: createLazyIcon("filter"),
  sort: createLazyIcon("sort"),
  info: createLazyIcon("info"),
  alert: createLazyIcon("alert"),
  success: createLazyIcon("success"),
  chevronDown: createLazyIcon("chevronDown"),
  chevronUp: createLazyIcon("chevronUp"),
  chevronStart: createLazyIcon("chevronStart"),
  chevronEnd: createLazyIcon("chevronEnd"),
  chevronsStart: createLazyIcon("chevronsStart"),
  chevronsEnd: createLazyIcon("chevronsEnd"),
  arrowStart: createLazyIcon("arrowStart"),
  arrowEnd: createLazyIcon("arrowEnd"),
  star: createLazyIcon("star"),
  starFilled: createLazyIcon("starFilled"),
  globe: Globe,
  loader: createLazyIcon("loader"),
  file: createLazyIcon("file"),
  image: createLazyIcon("image"),
  video: createLazyIcon("video"),
} as const satisfies Record<IconName, ComponentType<LucideProps> | LazyIconComponent>;

export const IconMenu = iconRegistry.menu;
export const IconClose = iconRegistry.close;
export const IconSearch = iconRegistry.search;
export const IconUser = iconRegistry.user;
export const IconCheck = iconRegistry.check;
export const IconAlert = iconRegistry.alert;
export const IconChevronStart = iconRegistry.chevronStart;
export const IconChevronEnd = iconRegistry.chevronEnd;
export const IconGlobe = Globe;
export const IconLoader = iconRegistry.loader;

const directionalIcons: readonly IconName[] = [
  "chevronStart",
  "chevronEnd",
  "chevronsStart",
  "chevronsEnd",
  "arrowStart",
  "arrowEnd",
];

/** Returns whether an icon should flip horizontally for the current direction.
 * @param name Registered icon identifier.
 * @param direction Explicit direction or inherited document direction.
 */
export function getIconDirectionBehavior(
  name: IconName,
  direction: IconDirection,
): "flip" | "auto" | "none" {
  if (!iconNames.includes(name)) return "none";
  if (!directionalIcons.includes(name)) return "none";
  if (direction === "rtl") return "flip";
  return direction === "auto" ? "auto" : "none";
}
