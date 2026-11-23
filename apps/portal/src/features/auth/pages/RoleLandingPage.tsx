import { useTranslation } from "react-i18next";
import { Heading, Text } from "@noldg/ui";
import { useAuthSnapshot } from "../../../shared/auth/auth-store";

/** Renders the intentionally empty role landing placeholder until its product module is built. */
export function RoleLandingPage() {
  const { t } = useTranslation("auth");
  const user = useAuthSnapshot().user;
  const role = user ? t(`roles.${user.role}`) : "";
  return (
    <section className="flex flex-col gap-3">
      <Heading level={1}>{t("landing.title", { name: user?.name ?? "" })}</Heading>
      <Text>{t("landing.role", { role })}</Text>
    </section>
  );
}
