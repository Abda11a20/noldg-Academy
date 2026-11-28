import { useTranslation } from "react-i18next";
import { Heading, Text } from "@noldg/ui";

/** Renders the lesson's plain-text description.
 * @param props Backend description rendered as text, never HTML.
 */
export function LessonDescription({ description }: { description: string }) {
  const { t } = useTranslation("learning");
  return (
    <section className="flex flex-col gap-2">
      <Heading level={2}>{t("lesson.about")}</Heading>
      <Text>{description}</Text>
    </section>
  );
}
