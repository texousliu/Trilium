import { test, expect, Page } from "@playwright/test";
import App from "./support/app";

test("Displays translations in Settings", async ({ page }) => {
    const app = new App(page);
    await app.goto();
    await app.closeAllTabs();
    await app.goToSettings();
    await app.noteTree.getByText("Appearance").click();

    expect(app.currentNoteSplit).toContainText("Localization");
    expect(app.currentNoteSplit).toContainText("Language");
});

test("User can change language from settings", async ({ page }) => {
    const app = new App(page);
    await app.goto();

    await app.closeAllTabs();
    await app.goToSettings();
    await app.noteTree.getByText("Appearance").click();

    // Check that the default value (English) is set.
    await expect(app.currentNoteSplit).toContainText("Theme");
    const languageCombobox = await app.currentNoteSplit.getByRole("combobox").first();
    await expect(languageCombobox).toHaveValue("en");

    // Select Chinese and ensure the translation is set.
    languageCombobox.selectOption("cn");
    await expect(app.currentNoteSplit).toContainText("主题");

    // Select English again.
    languageCombobox.selectOption("en");
});
