import { test, expect, Page } from "@playwright/test";
import App from "../support/app";

test("Displays simple map", async ({ page, context }) => {
    const app = new App(page, context);
    await app.goto();
    await app.goToNoteInNewTab("Sample mindmap");

    expect(app.currentNoteSplit).toContainText("Hello world");
    expect(app.currentNoteSplit).toContainText("1");
    expect(app.currentNoteSplit).toContainText("1a");
});
