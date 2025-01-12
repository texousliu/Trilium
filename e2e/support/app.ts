import { expect, Locator, Page } from "@playwright/test";
import type { BrowserContext } from "@playwright/test";

interface GotoOpts {
    isMobile?: boolean;
}

export default class App {
    readonly page: Page;
    readonly context: BrowserContext;

    readonly tabBar: Locator;
    readonly noteTree: Locator;
    readonly currentNoteSplit: Locator;
    readonly sidebar: Locator;

    constructor(page: Page, context: BrowserContext) {
        this.page = page;
        this.context = context;

        this.tabBar = page.locator(".tab-row-widget-container");
        this.noteTree = page.locator(".tree-wrapper");
        this.currentNoteSplit = page.locator(".note-split:not(.hidden-ext)")
        this.sidebar = page.locator("#right-pane");
    }

    async goto(opts: GotoOpts = {}) {
        await this.context.addCookies([
            {
                url: "http://127.0.0.1:8082",
                name: "trilium-device",
                value: opts.isMobile ? "mobile" : "desktop"
            }
        ]);

        await this.page.goto("/", { waitUntil: "networkidle" });

        // Wait for the page to load.
        await expect(this.page.locator(".tree"))
            .toContainText("Trilium Integration Test");
        await this.closeAllTabs();
    }

    async goToNoteInNewTab(noteTitle: string) {
        const autocomplete = this.currentNoteSplit.locator(".note-autocomplete");
        await autocomplete.fill(noteTitle);
        await autocomplete.press("ArrowDown");
        await autocomplete.press("Enter");
    }

    async goToSettings() {
        await this.page.locator(".launcher-button.bx-cog").click();
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
        await this.page.waitForTimeout(500); // TODO: context menu won't dismiss otherwise
    }

    async addNewTab() {
        await this.page.locator('[data-trigger-command="openNewTab"]').click();
    }

    async clickNoteOnNoteTreeByTitle(title: string) {
        this.noteTree.getByText(title).click();
    }

}
