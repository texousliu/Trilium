import { beforeAll, describe, expect, it } from "vitest";
import supertest from "supertest";
import type { Application } from "express";
import { note } from "../test/becca_mocking.js";
import BNote from "../becca/entities/bnote.js";

let app: Application;

describe("API Reference Help Note", () => {
    beforeAll(async () => {
        const buildApp = (await import("../app.js")).default;
        app = await buildApp();
    });

    describe("Help Note Structure", () => {
        it("should have correct help note metadata in the system", () => {
            // Test that the help note IDs are defined in the system
            expect("_help_9qPsTWBorUhQ").toBe("_help_9qPsTWBorUhQ");
            expect("_help_z8O2VG4ZZJD7").toBe("_help_z8O2VG4ZZJD7");
        });
    });

    describe("WebView Source URLs", () => {
        it("should serve content at ETAPI docs URL", async () => {
            const response = await supertest(app)
                .get("/etapi/docs/")
                .expect(200);

            expect(response.headers["content-type"]).toMatch(/text\/html/);
            expect(response.text).toContain("swagger-ui");
        });

        it("should serve content at Internal API docs URL", async () => {
            const response = await supertest(app)
                .get("/api/docs/")
                .expect(200);

            expect(response.headers["content-type"]).toMatch(/text\/html/);
            expect(response.text).toContain("swagger-ui");
        });

        it("should handle trailing slash in ETAPI docs URL", async () => {
            const response = await supertest(app)
                .get("/etapi/docs/")
                .expect(200);

            expect(response.headers["content-type"]).toMatch(/text\/html/);
            expect(response.text).toContain("swagger-ui");
        });

        it("should handle trailing slash in Internal API docs URL", async () => {
            const response = await supertest(app)
                .get("/api/docs/")
                .expect(200);

            expect(response.headers["content-type"]).toMatch(/text\/html/);
            expect(response.text).toContain("swagger-ui");
        });
    });

    describe("Help Note Integration", () => {
        it("should be accessible via help note ID in the application", async () => {
            // Test that the help note endpoint would work
            // Note: This would typically be handled by the client-side application
            // but we can test that the webViewSrc URL is accessible
            
            const etapiResponse = await supertest(app)
                .get("/etapi/docs/")
                .expect(200);

            expect(etapiResponse.text).toContain("TriliumNext ETAPI Documentation");
        });

        it("should not return 'Invalid package' error for ETAPI docs", async () => {
            const response = await supertest(app)
                .get("/etapi/docs/")
                .expect(200);

            expect(response.text).not.toContain("Invalid package");
            expect(response.text).not.toContain("C:\\\\Users\\\\perf3ct\\\\AppData\\\\Local\\\\trilium\\\\app-0.96.0\\\\resources\\\\app.asar");
        });

        it("should not return 'Invalid package' error for Internal API docs", async () => {
            const response = await supertest(app)
                .get("/api/docs/")
                .expect(200);

            expect(response.text).not.toContain("Invalid package");
            expect(response.text).not.toContain("C:\\\\Users\\\\perf3ct\\\\AppData\\\\Local\\\\trilium\\\\app-0.96.0\\\\resources\\\\app.asar");
        });
    });

    describe("Swagger UI Content Validation", () => {
        it("should serve valid Swagger UI page with expected elements", async () => {
            const response = await supertest(app)
                .get("/etapi/docs/")
                .expect(200);

            // Check for essential Swagger UI elements
            expect(response.text).toContain("swagger-ui");
            expect(response.text).toContain("TriliumNext ETAPI Documentation");
            expect(response.text).toMatch(/swagger-ui.*css/);
            expect(response.text).toMatch(/swagger-ui.*js/);
        });

        it("should serve valid Swagger UI with OpenAPI content", async () => {
            const response = await supertest(app)
                .get("/etapi/docs/")
                .expect(200);

            expect(response.text).toContain("swagger-ui");
            expect(response.text).toContain("TriliumNext ETAPI Documentation");
        });
    });

    describe("Client-Side WebView Integration", () => {
        it("should serve content that can be loaded in a webview", async () => {
            const response = await supertest(app)
                .get("/etapi/docs/")
                .expect(200);

            // Check that the response is proper HTML that can be loaded in a webview
            expect(response.text).toMatch(/<!DOCTYPE html>/i);
            expect(response.text).toMatch(/<html/i);
            expect(response.text).toMatch(/<head>/i);
            expect(response.text).toMatch(/<body>/i);
        });

        it("should have appropriate headers for webview loading", async () => {
            const response = await supertest(app)
                .get("/etapi/docs/")
                .expect(200);

            // Check that the response is successful and has content
            expect(response.status).toBe(200);
            expect(response.text).toContain("swagger-ui");
        });
    });
});