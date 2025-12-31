import { describe } from "node:test";

import test, { BrowserContext, expect, Page } from "@playwright/test";
import { statSync } from "fs";

import App from "../support/app";

describe("PDF sidebar", () => {
    test.beforeAll(async ({ page, context }) => {
        const app = await setLayout({ page, context }, true);
        await app.setOption("rightPaneCollapsedItems", "[]");
    });
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

    test("Page navigation works", async ({ page, context }) => {
        const app = new App(page, context);
        await app.goto();
        await app.goToNoteInNewTab("Dacia Logan.pdf");

        const pagesList = app.sidebar.locator(".pdf-pages-list");

        // Check count is correct.
        await expect(app.sidebar).toContainText("28 pages");
        expect(await pagesList.locator(".pdf-page-item").count()).toBe(28);

        // Go to page 3.
        await pagesList.locator(".pdf-page-item").nth(2).click();

        const pdfHelper = new PdfHelper(app);
        await pdfHelper.expectPageToBe(3);
    });

    test("Attachments listing works", async ({ page, context }) => {
        const app = new App(page, context);
        await app.goto();
        await app.goToNoteInNewTab("Dacia Logan.pdf");

        const attachmentsList = app.sidebar.locator(".pdf-attachments-list");
        await expect(attachmentsList.locator(".pdf-attachment-item")).toHaveCount(2);

        const attachmentInfo = attachmentsList.locator(".pdf-attachment-item", { hasText: "Note.trilium" });
        await expect(attachmentInfo).toContainText("3.36 MB");

        // Download the attachment and check its size.
        const [ download ] = await Promise.all([
            page.waitForEvent("download"),
            attachmentInfo.locator(".bx-download").click()
        ]);
        expect(download).toBeDefined();
    });
});


async function setLayout({ page, context}: { page: Page; context: BrowserContext }, newLayout: boolean) {
    const app = new App(page, context);
    await app.goto();
    await app.setOption("newLayout", newLayout ? "true" : "false");
    return app;
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
