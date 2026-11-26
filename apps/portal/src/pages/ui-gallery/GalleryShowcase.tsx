import { Container, Divider } from "@noldg/ui";
import { GalleryData } from "./GalleryData";
import { GalleryFeedback } from "./GalleryFeedback";
import { GalleryForms } from "./GalleryForms";
import { GalleryCatalog } from "./GalleryCatalog";

export interface GalleryShowcaseProps {
  direction: "rtl" | "ltr";
}

/** Displays the F1A shared components with translated examples and interaction states. */
export function GalleryShowcase({ direction }: GalleryShowcaseProps) {
  return (
    <Container
      className="space-y-8 rounded-lg border border-border bg-background p-4 sm:p-6"
      size="full"
    >
      <GalleryForms direction={direction} />
      <GalleryCatalog />
      <GalleryFeedback />
      <GalleryData />
      <Divider />
    </Container>
  );
}
