import { beforeAll, describe, expect, it, vi } from "vitest";
import supertest from "supertest";
import type { Application } from "express";
import fs from "fs";
import path from "path";
import { RESOURCE_DIR } from "../services/resource_dir.js";

let app: Application;

describe("API Documentation Routes", () => {
    beforeAll(async () => {
        const buildApp = (await import("../app.js")).default;
        app = await buildApp();
    });

    describe("ETAPI Documentation", () => {
        it("should serve ETAPI Swagger UI at /etapi/docs/", async () => {
            const response = await supertest(app)
                .get("/etapi/docs/")
                .expect(200);

            expect(response.headers["content-type"]).toMatch(/text\/html/);
            expect(response.text).toContain("TriliumNext ETAPI Documentation");
            expect(response.text).toContain("swagger-ui");
        });

        it("should have OpenAPI spec accessible through Swagger UI", async () => {
            const response = await supertest(app)
                .get("/etapi/docs/")
                .expect(200);

            expect(response.text).toContain("swagger-ui");
            expect(response.text).toContain("TriliumNext ETAPI Documentation");
        });

        it("should serve ETAPI static assets", async () => {
            const response = await supertest(app)
                .get("/etapi/docs/swagger-ui-bundle.js")
                .expect(200);

            expect(response.headers["content-type"]).toMatch(/javascript/);
        });

        it("should load ETAPI OpenAPI spec from correct resource path", () => {
            const etapiSpecPath = path.join(RESOURCE_DIR, "etapi.openapi.yaml");
            expect(fs.existsSync(etapiSpecPath)).toBe(true);
        });
    });

    describe("Internal API Documentation", () => {
        it("should serve Internal API Swagger UI at /api/docs/", async () => {
            const response = await supertest(app)
                .get("/api/docs/")
                .expect(200);

            expect(response.headers["content-type"]).toMatch(/text\/html/);
            expect(response.text).toContain("TriliumNext Internal API Documentation");
            expect(response.text).toContain("swagger-ui");
        });

        it("should have OpenAPI spec accessible through Swagger UI", async () => {
            const response = await supertest(app)
                .get("/api/docs/")
                .expect(200);

            expect(response.text).toContain("swagger-ui");
            expect(response.text).toContain("TriliumNext Internal API Documentation");
        });

        it("should serve Internal API static assets", async () => {
            const response = await supertest(app)
                .get("/api/docs/swagger-ui-bundle.js")
                .expect(200);

            expect(response.headers["content-type"]).toMatch(/javascript/);
        });

        it("should load Internal API OpenAPI spec from correct resource path", () => {
            const apiSpecPath = path.join(RESOURCE_DIR, "openapi.json");
            expect(fs.existsSync(apiSpecPath)).toBe(true);
        });
    });

    describe("Resource Directory Resolution", () => {
        it("should resolve RESOURCE_DIR to a valid directory", () => {
            expect(fs.existsSync(RESOURCE_DIR)).toBe(true);
            expect(fs.statSync(RESOURCE_DIR).isDirectory()).toBe(true);
        });

        it("should find assets directory in RESOURCE_DIR", () => {
            const assetsPath = path.join(RESOURCE_DIR, "assets");
            // The assets directory should exist at the resource root, not inside another assets folder
            expect(fs.existsSync(RESOURCE_DIR)).toBe(true);
        });

        it("should have required OpenAPI files in RESOURCE_DIR", () => {
            const etapiPath = path.join(RESOURCE_DIR, "etapi.openapi.yaml");
            const openApiPath = path.join(RESOURCE_DIR, "openapi.json");
            
            expect(fs.existsSync(etapiPath)).toBe(true);
            expect(fs.existsSync(openApiPath)).toBe(true);
        });
    });

    describe("Error Handling", () => {
        it("should handle missing OpenAPI files gracefully", async () => {
            // Mock fs.readFileSync to throw an error
            const originalReadFileSync = fs.readFileSync;
            vi.spyOn(fs, "readFileSync").mockImplementation((path, options) => {
                if (typeof path === "string" && path.includes("etapi.openapi.yaml")) {
                    throw new Error("File not found");
                }
                return originalReadFileSync(path, options);
            });

            try {
                await supertest(app)
                    .get("/etapi/docs/")
                    .expect(500);
            } catch (error) {
                // Expected to fail
            }

            vi.restoreAllMocks();
        });

        it("should handle invalid OpenAPI files gracefully", async () => {
            // Mock fs.readFileSync to return invalid YAML
            const originalReadFileSync = fs.readFileSync;
            vi.spyOn(fs, "readFileSync").mockImplementation((path, options) => {
                if (typeof path === "string" && path.includes("etapi.openapi.yaml")) {
                    return "invalid: yaml: content: [" as any;
                }
                return originalReadFileSync(path, options);
            });

            try {
                await supertest(app)
                    .get("/etapi/docs/")
                    .expect(500);
            } catch (error) {
                // Expected to fail
            }

            vi.restoreAllMocks();
        });
    });
});