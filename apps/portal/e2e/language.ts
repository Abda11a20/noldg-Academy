import type { Page } from "@playwright/test";

/** Switches the portal locale through the desktop header or compact mobile account menu.
 * @param page Current browser page.
 * @param currentLanguage Locale currently shown in the document.
 */
export async function switchLanguage(page: Page, currentLanguage: "ar" | "en"): Promise<void> {
  const viewportWidth = page.viewportSize()?.width ?? 1280;
  if (viewportWidth < 768) {
    const triggerName = currentLanguage === "ar" ? "قائمة الحساب" : "Account menu";
    const nextLanguage = currentLanguage === "ar" ? "English" : "العربية";
    await page.getByRole("button", { name: triggerName }).click();
    await page.getByRole("menuitem", { name: nextLanguage }).click();
    return;
  }
  const label = currentLanguage === "ar" ? "تغيير اللغة" : "Change language";
  await page.getByRole("banner").getByRole("button", { name: label }).click();
}
