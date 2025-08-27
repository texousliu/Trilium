import type { Application } from "express";
import swaggerUi from "swagger-ui-express";
import { join } from "path";
import yaml from "js-yaml";
import type { JsonObject } from "swagger-ui-express";
import fs from "fs";
import { RESOURCE_DIR } from "../services/resource_dir";
import log from "../services/log";

// Cache the documents to avoid repeated file reads, especially important for ASAR archives
let etapiDocument: JsonObject | null = null;
let apiDocument: JsonObject | null = null;

function loadDocuments(): { etapi: JsonObject | null; api: JsonObject | null } {
    if (etapiDocument && apiDocument) {
        return { etapi: etapiDocument, api: apiDocument };
    }

    try {
        const etapiPath = join(RESOURCE_DIR, "etapi.openapi.yaml");
        const apiPath = join(RESOURCE_DIR, "api-openapi.yaml");
        
        // Load and cache the documents
        const etapiYaml = fs.readFileSync(etapiPath, "utf8");
        etapiDocument = yaml.load(etapiYaml) as JsonObject;
        
        const apiYaml = fs.readFileSync(apiPath, "utf8");
        apiDocument = yaml.load(apiYaml) as JsonObject;
        
        log.info("OpenAPI documents loaded successfully");
        return { etapi: etapiDocument, api: apiDocument };
    } catch (error) {
        log.error(`Failed to load OpenAPI documents from ${RESOURCE_DIR}: ${error}`);
        return { etapi: null, api: null };
    }
}

export default function register(app: Application) {
    try {
        const docs = loadDocuments();
        
        if (!docs.etapi || !docs.api) {
            log.error("OpenAPI documents could not be loaded, skipping API documentation setup");
            return;
        }

        // Use serveFiles for multiple Swagger instances
        // Note: serveFiles returns an array of middleware, so we need to spread it
        app.use(
            "/etapi/docs", 
            ...swaggerUi.serveFiles(docs.etapi), 
            swaggerUi.setup(docs.etapi, {
                explorer: true,
                customSiteTitle: "TriliumNext ETAPI Documentation"
            })
        );

        app.use(
            "/api/docs", 
            ...swaggerUi.serveFiles(docs.api), 
            swaggerUi.setup(docs.api, {
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
