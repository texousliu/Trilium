import { describe } from "node:test";

import test, { BrowserContext, expect, Page } from "@playwright/test";

import App from "../support/app";

describe("PDF sidebar", () => {
    // test.beforeAll(async ({ page, context }) => await setLayout({ page, context }, false));
    // test.beforeAll(async ({ page, context }) => await setLayout({ page, context }, true));

    test("Table of contents works", async ({ page, context }) => {
        const app = new App(page, context);
        await app.goto();
        await app.goToNoteInNewTab("Dacia Logan.pdf");

        const toc = app.sidebar.locator(".toc");

        await expect(toc.locator("li")).toHaveCount(48);
        await expect(toc.locator("li", { hasText: "Logan Van" })).toHaveCount(1);

        const pdfHelper = new PdfHelper(app);
        await toc.locator("li", { hasText: "Logan Pick-Up" }).click();
        await pdfHelper.expectPageToBe(13);
    });
});

async function setLayout({ page, context}: { page: Page; context: BrowserContext }, newLayout: boolean) {
    const app = new App(page, context);
    await app.goto();
    await app.setOption("newLayout", newLayout ? "true" : "false");
}

class PdfHelper {
    private contentFrame: ReturnType<Page["frameLocator"]>;

    constructor(app: App) {
        this.contentFrame = app.currentNoteSplit.frameLocator("iframe");
    }

    async expectPageToBe(expectedPageNumber: number) {
        await expect(this.contentFrame.locator("#pageNumber")).toHaveValue(`${expectedPageNumber}`);
    }
}
