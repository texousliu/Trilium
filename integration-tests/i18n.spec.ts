import test, { expect } from "@playwright/test";

test("Restores language on start-up on desktop", async ({ page, context }) => {
    await page.goto("http://localhost:8082");
    await expect(page.locator("#launcher-pane").first()).toContainText("Open New Window");
});

test("Restores language on start-up on mobile", async ({ page, context }) => {
    await context.addCookies([
        {
            url: "http://localhost:8082",
            name: "trilium-device",
            value: "mobile"
        }
    ]);
    await page.goto("http://localhost:8082");
    await expect(page.locator("#launcher-pane div").first()).toContainText("Open New Window");
});
