import { useTranslation } from "react-i18next";
import { Heading, Text } from "@noldg/ui";

/** Shows the planned quiz destination without implementing quiz behavior in this step. */
export function LessonQuizStubPage() {
  const { t } = useTranslation("learning");
  return (
    <section className="flex flex-col gap-3">
      <Heading level={1}>{t("quiz.title")}</Heading>
      <Text>{t("quiz.comingSoon")}</Text>
    </section>
  );
}
