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
