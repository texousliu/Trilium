import { test, expect, Page } from "@playwright/test";
import App from "../support/app";

test("Displays lint warnings for backend script", async ({ page }) => {
    const app = new App(page);
    await app.goto();
    await app.closeAllTabs();
    await app.goToNoteInNewTab("Backend script with lint warning");

    const codeEditor = app.currentNoteSplit.locator(".CodeMirror");
    expect(await app.currentNoteSplit.locator(".note-title").inputValue()).toBe("Backend script with lint warnings");

    // Expect two warning signs in the gutter.
    expect(codeEditor.locator(".CodeMirror-gutter-wrapper .CodeMirror-lint-marker-warning")).toHaveCount(2);

    // Hover over hello
    await codeEditor.getByText("hello").first().hover();
    await expectTooltip(page, "'hello' is defined but never used.");

    // Hover over world
    await codeEditor.getByText("world").first().hover();
    await expectTooltip(page, "'world' is defined but never used.");
});

async function expectTooltip(page: Page, tooltip: string) {
    await expect(page.locator(".CodeMirror-lint-tooltip:visible", {
        "hasText": tooltip
    })).toBeVisible();
}
