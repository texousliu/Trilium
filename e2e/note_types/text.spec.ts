import { test, expect, Page } from "@playwright/test";
import App from "../support/app";

test("Table of contents is displayed", async ({ page }) => {
    const app = new App(page);
    await app.goto();
    await app.closeAllTabs();
    await app.goToNoteInNewTab("Table of contents");

    await expect(app.sidebar).toContainText("Table of Contents");
    const rootList = app.sidebar.locator(".toc-widget > span > ol");

    // Heading 1.1
    //  Heading 1.1
    //  Heading 1.2
    // Heading 2
    //  Heading 2.1
    //  Heading 2.2
    //     Heading 2.2.1
    //          Heading 2.2.1.1
    //              Heading 2.2.11.1

    await expect(rootList.locator("> li")).toHaveCount(2);
    await expect(rootList.locator("> li").first()).toHaveText("Heading 1");
    await expect(rootList.locator("> ol").first().locator("> li").first()).toHaveText("Heading 1.1");
    await expect(rootList.locator("> ol").first().locator("> li").nth(1)).toHaveText("Heading 1.2");

    // Heading 2 has a Katex equation, check if it's rendered.
    await expect(rootList.locator("> li").nth(1)).toContainText("Heading 2");
    await expect(rootList.locator("> li").nth(1).locator(".katex")).toBeAttached();

    await expect(rootList.locator("> ol")).toHaveCount(2);
    await expect(rootList.locator("> ol").nth(1).locator("> li")).toHaveCount(2);
    await expect(rootList.locator("> ol").nth(1).locator("> ol")).toHaveCount(1);
    await expect(rootList.locator("> ol").nth(1).locator("> ol > ol")).toHaveCount(1);
    await expect(rootList.locator("> ol").nth(1).locator("> ol > ol > ol")).toHaveCount(1);
});

test("Highlights list is displayed", async ({ page }) => {
    const app = new App(page);
    await app.goto();
    await app.closeAllTabs();
    await app.goToNoteInNewTab("Highlights list");

    await expect(app.sidebar).toContainText("Highlights List");
    const rootList = app.sidebar.locator(".highlights-list ol");
    let index=0;
    for (const highlightedEl of [ "Bold 1", "Italic 1", "Underline 1", "Colored text 1", "Background text 1", "Bold 2", "Italic 2", "Underline 2", "Colored text 2", "Background text 2" ]) {
        await expect(rootList.locator("li").nth(index++)).toContainText(highlightedEl);
    }
});
