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
        const etapiPath = join(RESOURCE_DIR, "etapi.openapi.yaml");
        const apiPath = join(RESOURCE_DIR, "api-openapi.yaml");
        
        // Check if files exist
        if (!existsSync(etapiPath)) {
            log.error(`ETAPI OpenAPI spec not found at: ${etapiPath}`);
            return;
        }
        if (!existsSync(apiPath)) {
            log.error(`API OpenAPI spec not found at: ${apiPath}`);
            return;
        }
        
        const etapiDocument = yaml.load(readFileSync(etapiPath, "utf8")) as JsonObject;
        const apiDocument = yaml.load(readFileSync(apiPath, "utf8")) as JsonObject;

        // Use serveFiles for multiple Swagger instances
        // Note: serveFiles returns an array of middleware, so we need to spread it
        app.use(
            "/etapi/docs", 
            ...swaggerUi.serveFiles(etapiDocument), 
            swaggerUi.setup(etapiDocument, {
                explorer: true,
                customSiteTitle: "TriliumNext ETAPI Documentation"
            })
        );

        app.use(
            "/api/docs", 
            ...swaggerUi.serveFiles(apiDocument), 
            swaggerUi.setup(apiDocument, {
                explorer: true,
                customSiteTitle: "TriliumNext Internal API Documentation",
                customCss: '.swagger-ui .topbar { display: none }'
            })
        );
        
        log.info("Swagger UI endpoints registered at /etapi/docs and /api/docs");
    } catch (error) {
        log.error(`Failed to setup API documentation: ${error}`);
    }
}
