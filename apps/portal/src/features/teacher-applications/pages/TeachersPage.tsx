import { Heading, Tabs } from "@noldg/ui";
import { useTranslation } from "react-i18next";
import { ApplicationsPanel } from "../components/ApplicationsPanel";
import { TeacherAccountsPanel } from "../components/TeacherAccountsPanel";

/** Composes application, active teacher, and suspended teacher lists.
 * @returns Teacher administration page.
 */
export function TeachersPage() {
  const { t } = useTranslation("admin");
  return (
    <div className="space-y-6">
      <div>
        <Heading level={1}>{t("teachers.title")}</Heading>
        <p className="mt-2 text-foreground-muted">{t("teachers.description")}</p>
      </div>
      <Tabs
        label={t("teachers.title")}
        items={[
          {
            value: "applications",
            label: t("teachers.tabs.applications"),
            content: <ApplicationsPanel />,
          },
          {
            value: "active",
            label: t("teachers.tabs.active"),
            content: <TeacherAccountsPanel status="active" />,
          },
          {
            value: "suspended",
            label: t("teachers.tabs.suspended"),
            content: <TeacherAccountsPanel status="suspended" />,
          },
        ]}
      />
    </div>
  );
}
