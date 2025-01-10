import { test, expect } from "@playwright/test";
import App from "../support/app";

test("Can drag tabs around", async ({ page }) => {
    const app = new App(page);
    await app.goto();

    // [1]: Trilium Integration Test DB note
    const noteTitle = "Trilium Integration Test DB";
    await app.closeAllTabs();
    await app.clickNoteOnNoteTreeByTitle(noteTitle);
    await expect(app.getActiveTab()).toContainText(noteTitle);

    // [1] [2] [3]
    await app.addNewTab();
    await app.addNewTab();

    let tab = app.getTab(0);

    // Drag the first tab at the end
    await tab.dragTo(app.getTab(2), { targetPosition: { x: 50, y: 0 }});

    tab = app.getTab(2);
    await expect(tab).toContainText(noteTitle);

    // Drag the tab to the left
    await tab.dragTo(app.getTab(0), { targetPosition: { x: 50, y: 0 }});
    await expect(app.getTab(0)).toContainText(noteTitle);
});
