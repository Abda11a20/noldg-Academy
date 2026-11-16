import wordmark from "./assets/wordmark.svg";

/** Keys for image assets registered by the design system. */
export type ImageKey = "wordmark";

/** Image source and intrinsic dimensions for every supported image key. */
export const images = {
  wordmark: { src: wordmark, width: 340, height: 56 },
} satisfies Record<ImageKey, { src: string; width: number; height: number }>;
