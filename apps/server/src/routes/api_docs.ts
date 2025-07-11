import type { Application } from "express";
import swaggerUi from "swagger-ui-express";
import { join } from "path";
import yaml from "js-yaml";
import type { JsonObject } from "swagger-ui-express";
import { readFileSync, existsSync } from "fs";
import { RESOURCE_DIR } from "../services/resource_dir";
import log from "../services/log";

export default function register(app: Application) {
    try {
        // In packaged Electron apps, check if we need to read from the unpacked directory
        let resourceDir = RESOURCE_DIR;
        log.info(`[API Docs] Initial resource dir: ${resourceDir}`);
        
        if (resourceDir.includes('app.asar')) {
            const unpackedDir = RESOURCE_DIR.replace('app.asar', 'app.asar.unpacked');
            log.info(`[API Docs] Checking unpacked dir: ${unpackedDir}`);
            // Check if the unpacked directory has our files
            if (existsSync(join(unpackedDir, "etapi.openapi.yaml"))) {
                resourceDir = unpackedDir;
                log.info(`[API Docs] Using unpacked directory: ${resourceDir}`);
            }
        }
        
        const etapiSpecPath = join(resourceDir, "etapi.openapi.yaml");
        const apiSpecPath = join(resourceDir, "openapi.json");
        
        log.info(`[API Docs] Loading specs from: ${etapiSpecPath}, ${apiSpecPath}`);
        
        const etapiDocument = yaml.load(readFileSync(etapiSpecPath, "utf8")) as JsonObject;
        const apiDocument = JSON.parse(readFileSync(apiSpecPath, "utf-8"));
        
        log.info("[API Docs] Successfully loaded OpenAPI documents");
        
        // Try to configure swagger-ui-express with custom options for Electron
        const swaggerOptions = {
            explorer: true,
            customSiteTitle: "TriliumNext ETAPI Documentation",
            // Disable some features that might not work well in Electron webview
            swaggerOptions: {
                persistAuthorization: true
            }
        };

        app.use(
            "/etapi/docs/",
            swaggerUi.serveFiles(etapiDocument),
            swaggerUi.setup(etapiDocument, swaggerOptions)
        );

        app.use(
            "/api/docs/",
            swaggerUi.serveFiles(apiDocument),
            swaggerUi.setup(apiDocument, {
                explorer: true,
                customSiteTitle: "TriliumNext Internal API Documentation",
                swaggerOptions: {
                    persistAuthorization: true
                }
            })
        );
        
        log.info("[API Docs] Swagger UI endpoints registered successfully");
        
    } catch (error) {
        log.error(`[API Docs] Failed to register Swagger UI: ${error}`);
        
        // Register fallback endpoints
        app.use("/etapi/docs/", (req, res) => {
            res.status(500).json({
                error: "API Documentation Unavailable",
                message: String(error),
                hint: "Check if OpenAPI files are accessible in the packaged application"
            });
        });
        
        app.use("/api/docs/", (req, res) => {
            res.status(500).json({
                error: "API Documentation Unavailable", 
                message: String(error),
                hint: "Check if OpenAPI files are accessible in the packaged application"
            });
        });
    }
}
