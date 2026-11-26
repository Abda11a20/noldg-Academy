import { useState } from "react";
import {
  Breadcrumbs,
  Button,
  ConfirmDialog,
  DropdownMenu,
  MobileNav,
  Pagination,
  Sidebar,
  Tabs,
  ToastProvider,
  useToast,
} from "@noldg/ui";
import { useTranslation } from "react-i18next";

function ToastGallery() {
  const { t } = useTranslation("common");
  const { notify } = useToast();
  return (
    <Button
      onClick={() =>
        notify({
          title: t("galleryToastTitle"),
          description: t("galleryToastBody"),
          tone: "success",
        })
      }
    >
      {t("galleryToastTrigger")}
    </Button>
  );
}

/** Demonstrates the shared F3 navigation, overlay, and feedback primitives.
 * @returns Direction-aware sample controls for the development gallery.
 */
export function GalleryInfrastructure() {
  const { t } = useTranslation(["common", "admin"]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const links = [{ to: "/login", label: t("goHome"), icon: "home" as const }];
  const tabItems = [
    { value: "first", label: t("galleryFirstTab"), content: <p>{t("galleryFirstPanel")}</p> },
    { value: "second", label: t("gallerySecondTab"), content: <p>{t("gallerySecondPanel")}</p> },
  ];
  return (
    <section className="space-y-4 rounded-md border border-border p-4">
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setDialogOpen(true)}>{t("galleryDialogTrigger")}</Button>
        <DropdownMenu
          trigger={t("sampleAction")}
          triggerLabel={t("galleryMenuLabel")}
          items={[{ id: "view", label: t("sampleAction"), onSelect: () => undefined }]}
        />
        <MobileNav
          items={links}
          label={t("navigation.label")}
          openLabel={t("navigation.open")}
          closeLabel={t("navigation.close")}
        />
        <ToastProvider dismissLabel={t("toastDismiss")}>
          <ToastGallery />
        </ToastProvider>
      </div>
      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={t("galleryDialogTitle")}
        description={t("galleryDialogBody")}
        closeLabel={t("toastDismiss")}
        confirmLabel={t("continue")}
        cancelLabel={t("sampleAction")}
        onConfirm={() => setDialogOpen(false)}
      />
      <Tabs label={t("galleryTabsLabel")} items={tabItems} />
      <Breadcrumbs
        label={t("galleryBreadcrumbLabel")}
        items={[{ label: t("goHome"), to: "/login" }, { label: t("galleryCurrentPage") }]}
      />
      <Sidebar items={links} label={t("navigation.label")} />
      <Pagination
        page={1}
        pageSize={10}
        total={20}
        pageLabel={t("admin:list.pageLabel")}
        pageSizeLabel={t("admin:list.pageSize")}
        pageSizePlaceholder={t("admin:list.pageSizePlaceholder")}
        previousLabel={t("admin:list.previous")}
        nextLabel={t("admin:list.next")}
        pageStatus={(page, count) => t("admin:list.pageStatus", { page, count })}
        pageSizeOptions={[10, 20, 50]}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
      />
    </section>
  );
}
