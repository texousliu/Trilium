import { test, expect, Page } from "@playwright/test";
import App from "../support/app";

test("renders ELK flowchart", async ({ page, context }) => {
    const app = new App(page, context);
    await app.goto();
    await app.goToNoteInNewTab("Flowchart ELK on");

    const svgData = app.currentNoteSplit.locator(".mermaid-render svg");
    await expect(svgData).toMatchAriaSnapshot(`
      - document:
        - paragraph: A
        - paragraph: B
        - paragraph: C
        - paragraph: Guarantee
        - paragraph: User attributes
        - paragraph: Master data
        - paragraph: Exchange Rate
        - paragraph: Profit Centers
        - paragraph: Vendor Partners
        - paragraph: Work Situation
        - paragraph: Customer
        - paragraph: Profit Centers
        - paragraph: Guarantee
        - text: Interfaces for B
    `);
});
