import { Locator, Page, expect } from "@playwright/test";

export default class App {
    readonly page: Page;

    readonly tabBar: Locator;
    readonly noteTree: Locator;

    constructor(page: Page) {
        this.page = page;
        this.tabBar = page.locator(".tab-row-widget-container");
        this.noteTree = page.locator(".tree-wrapper");
    }

    async goto() {
        await this.page.goto("/", { waitUntil: "networkidle" });

        // Wait for the page to load.
        await expect(this.page.locator(".tree"))
            .toContainText("Trilium Integration Test");
    }

    getTab(tabIndex: number) {
        return this.tabBar.locator(".note-tab-wrapper").nth(tabIndex);
    }

    getActiveTab() {
        return this.tabBar.locator(".note-tab[active]");
    }

    async closeAllTabs() {
        await this.getTab(0).click({ button: "right" });
        await this.page.waitForTimeout(500); // TODO: context menu won't dismiss otherwise
        await this.page.getByText("Close all tabs").click({ force: true });
    }

    async addNewTab() {
        await this.page.locator('[data-trigger-command="openNewTab"]').click();
    }

    async clickNoteOnNoteTreeByTitle(title: string) {
        this.noteTree.getByText(title).click();
    }

}
